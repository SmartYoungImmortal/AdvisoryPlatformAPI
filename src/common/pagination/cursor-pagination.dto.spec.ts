import {
  CursorPaginationDto,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from './cursor-pagination.dto';

describe('CursorPaginationDto', () => {
  it('defaults to a limit of 20 without a cursor', () => {
    const dto = new CursorPaginationDto();

    expect(dto).toEqual({ limit: 20 });
  });

  it('round-trips an opaque keyset cursor', () => {
    const cursor = {
      createdAt: new Date('2026-08-15T10:00:00.000Z'),
      id: '11111111-1111-4111-8111-111111111111',
    };

    expect(decodeKeysetCursor(encodeKeysetCursor(cursor))).toEqual(cursor);
  });

  it('rejects malformed and structurally invalid cursors', () => {
    expect(decodeKeysetCursor('not-json')).toBeUndefined();
    expect(
      decodeKeysetCursor(
        Buffer.from(
          JSON.stringify({ createdAt: 'invalid', id: 'invalid' }),
        ).toString('base64url'),
      ),
    ).toBeUndefined();
  });
});
