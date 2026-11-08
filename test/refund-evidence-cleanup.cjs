/** Local-only cleanup for the opt-in browser proof; never reads DATABASE_URL. */
const { Pool } = require('pg');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const id = process.argv[2];
if (!/^[0-9a-f-]{36}$/.test(id ?? ''))
  throw new Error('A fixture refund UUID is required');
const connectionString = process.env.REFUND_PROOF_DATABASE_URL;
const endpoint = process.env.REFUND_PROOF_S3_ENDPOINT;
if (!connectionString || !endpoint)
  throw new Error(
    'Explicit local proof database and storage URLs are required',
  );
for (const url of [new URL(connectionString), new URL(endpoint)]) {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('Remote proof targets are forbidden');
}
if (new URL(connectionString).pathname !== '/advisory_proof')
  throw new Error('Only the named advisory_proof database is allowed');
const accessKeyId = process.env.REFUND_PROOF_S3_ACCESS_KEY;
const secretAccessKey = process.env.REFUND_PROOF_S3_SECRET_KEY;
const bucket = process.env.REFUND_PROOF_S3_BUCKET;
if (!accessKeyId || !secretAccessKey || !bucket)
  throw new Error('Explicit proof storage credentials and bucket are required');
void (async () => {
  const pool = new Pool({ connectionString });
  try {
    const { rows } = await pool.query(
      'select object_key from refund_case_evidence where refund_case_id=$1',
      [id],
    );
    const client = new S3Client({
      endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
    await Promise.all(
      rows.map((row) =>
        client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: row.object_key }),
        ),
      ),
    );
  } finally {
    await pool.end();
  }
})();
