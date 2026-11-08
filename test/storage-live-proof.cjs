/* Opt-in proof against the disposable local API and real SeaweedFS. No shared DB. */
const assert = require('node:assert/strict');
const { createHash, randomUUID } = require('node:crypto');
const { mkdirSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');

const base = process.env.STORAGE_PROOF_API_URL || 'http://localhost:3200';
const apiUrl = new URL(base);
assert.ok(['localhost', '127.0.0.1'].includes(apiUrl.hostname));
assert.ok(['3200', '3201'].includes(apiUrl.port));
assert.equal(apiUrl.protocol, 'http:');
const evidence = resolve(__dirname, '../../.audit/storage-proof-2026-10-27');
const checks = [];
const uploadedIds = [];
const roomId = randomUUID();
const databaseUrl = process.env.STORAGE_PROOF_DATABASE_URL;
const demoPassword = process.env.STORAGE_PROOF_PASSWORD;
assert.ok(demoPassword, 'Set STORAGE_PROOF_PASSWORD to the local seeded password');
assert.equal(process.env.STORAGE_LIVE_PROOF, '1', 'Set STORAGE_LIVE_PROOF=1');
assert.ok(
  databaseUrl,
  'Set STORAGE_PROOF_DATABASE_URL to the disposable proof DB',
);
const parsed = new URL(databaseUrl);
assert.ok(['localhost', '127.0.0.1'].includes(parsed.hostname));
assert.equal(parsed.port, '55432');
assert.equal(parsed.pathname, '/advisory_proof');
const db = new Client({ connectionString: databaseUrl });
let senderCookie;
let roomCreated = false;

function record(name, observed) {
  checks.push({ name, observed, result: 'PASS' });
  console.log(`PASS ${name}: ${JSON.stringify(observed)}`);
}
async function api(path, cookie, options = {}) {
  return fetch(`${base}${path}`, {
    ...options,
    headers: {
      origin: 'http://localhost:3001',
      ...(cookie ? { cookie } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(120000),
  });
}
async function login(email) {
  const response = await api('/api/auth/sign-in/email', undefined, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: demoPassword }),
  });
  assert.equal(response.status, 200, `Login ${email}`);
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}
async function upload(bytes, cookie, type = 'text/plain') {
  const body = new FormData();
  body.append('file', new Blob([bytes], { type }), 'storage-proof.txt');
  return api(`/api/v1/chat/rooms/${roomId}/files`, cookie, {
    method: 'POST',
    body,
  });
}
async function main() {
  await db.connect();
  const users = await db.query(
    'SELECT id, email FROM "user" WHERE email LIKE $1 AND banned IS NOT TRUE ORDER BY email LIMIT 3',
    ['%@advisory.demo'],
  );
  assert.equal(users.rows.length, 3, 'Three seeded demo users required');
  const [sender, peer, outsider] = users.rows;
  senderCookie = await login(sender.email);
  const peerCookie = await login(peer.email);
  const outsiderCookie = await login(outsider.email);
  await db.query('INSERT INTO chat_rooms (id) VALUES ($1)', [roomId]);
  roomCreated = true;
  await db.query(
    'INSERT INTO chat_members (chat_room_id,member_user_id) VALUES ($1,$2),($1,$3)',
    [roomId, sender.id, peer.id],
  );
  const path = `/api/v1/chat/rooms/${roomId}/files`;
  assert.equal((await upload(Buffer.from('anonymous'), undefined)).status, 401);
  record('unauthenticated upload denied', 401);
  assert.equal(
    (await upload(Buffer.from('outsider'), outsiderCookie)).status,
    404,
  );
  record('nonmember upload denied', 404);
  const invalid = await upload(
    Buffer.from('executable'),
    senderCookie,
    'application/x-msdownload',
  );
  assert.equal(invalid.status, 400);
  record('unsupported MIME denied', invalid.status);
  for (const size of [1024, 50 * 1024 * 1024]) {
    const bytes = Buffer.alloc(size, 0x61);
    const response = await upload(bytes, senderCookie);
    const body = await response.json();
    assert.equal(response.status, 201, JSON.stringify(body));
    const file = body.data;
    uploadedIds.push(file.id);
    assert.equal(file.fileSizeBytes, size);
    assert.equal(file.objectKey, undefined);
    const persisted = await db.query(
      'SELECT object_key FROM chat_files WHERE id=$1',
      [file.id],
    );
    assert.match(persisted.rows[0].object_key, /^chat-files\//);
    assert.ok(!persisted.rows[0].object_key.includes('://'));
    record('real HTTP upload and opaque persisted key', {
      bytes: size,
      status: response.status,
    });
    const signedResponse = await api(`${path}/${file.id}`, peerCookie);
    assert.equal(signedResponse.status, 200);
    const { url, expiresInSeconds } = (await signedResponse.json()).data;
    assert.equal(expiresInSeconds, 300);
    const downloaded = await fetch(url);
    assert.equal(downloaded.status, 200);
    const received = Buffer.from(await downloaded.arrayBuffer());
    assert.equal(received.length, size);
    assert.equal(
      createHash('sha256').update(received).digest('hex'),
      createHash('sha256').update(bytes).digest('hex'),
    );
    record('peer signed download matches uploaded bytes', {
      bytes: size,
      expiresInSeconds,
    });
    const direct = new URL(url);
    direct.search = '';
    const unsigned = await fetch(direct);
    assert.ok(
      [401, 403].includes(unsigned.status),
      `Unsigned read ${unsigned.status}`,
    );
    record('unsigned direct object read denied', unsigned.status);
    assert.equal((await api(`${path}/${file.id}`, outsiderCookie)).status, 404);
    assert.equal((await api(`${path}/${file.id}`)).status, 401);
    assert.equal(
      (await api(`${path}/${file.id}`, peerCookie, { method: 'DELETE' }))
        .status,
      403,
    );
    record(
      'nonmember and anonymous download, peer deletion denied',
      [404, 401, 403],
    );
  }
  const before = await db.query(
    'SELECT count(*)::int n FROM chat_files WHERE chat_room_id=$1',
    [roomId],
  );
  const oversized = await upload(
    Buffer.alloc(50 * 1024 * 1024 + 1, 0x61),
    senderCookie,
  );
  assert.equal(oversized.status, 413);
  const after = await db.query(
    'SELECT count(*)::int n FROM chat_files WHERE chat_room_id=$1',
    [roomId],
  );
  assert.equal(after.rows[0].n, before.rows[0].n);
  record('50 MiB plus one byte rejected without metadata row', {
    status: oversized.status,
    bytes: 52428801,
  });
}
void (async () => {
  let failure;
  const cleanupErrors = [];
  async function cleanupStep(action) {
    try {
      await action();
    } catch (error) {
      cleanupErrors.push(error.message);
      console.error(`Cleanup: ${error.message}`);
    }
  }
  try {
    await main();
  } catch (error) {
    failure = error;
    console.error(error.message);
  } finally {
    try {
      if (roomCreated) {
        for (const id of uploadedIds) {
          await cleanupStep(async () => {
            const response = await api(
              `/api/v1/chat/rooms/${roomId}/files/${id}`,
              senderCookie,
              { method: 'DELETE' },
            );
            assert.equal(response.status, 200, `Owner cleanup for ${id}`);
          });
        }
        for (const table of ['chat_messages', 'chat_members', 'chat_rooms']) {
          const column = table === 'chat_rooms' ? 'id' : 'chat_room_id';
          await cleanupStep(async () => {
            await db.query(`DELETE FROM ${table} WHERE ${column}=$1`, [roomId]);
          });
        }
        if (cleanupErrors.length === 0) {
          record('proof objects and dedicated room cleaned up', true);
        }
      }
    } finally {
      try {
        await cleanupStep(async () => db.end());
      } finally {
        mkdirSync(evidence, { recursive: true });
        writeFileSync(
          resolve(evidence, 'results.json'),
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              result: failure || cleanupErrors.length ? 'FAIL' : 'PASS',
              checks,
              ...(failure ? { error: failure.message } : {}),
              ...(cleanupErrors.length
                ? { cleanupErrors, roomId, uploadedIds }
                : {}),
            },
            null,
            2,
          ),
        );
      }
    }
  }
  if (failure || cleanupErrors.length) process.exitCode = 1;
})();
