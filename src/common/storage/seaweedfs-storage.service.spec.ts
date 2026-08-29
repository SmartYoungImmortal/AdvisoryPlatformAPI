import type { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Environment } from '@/config/environment.enum';
import type { Env } from '@/config/env.schema';
import { SeaweedFsStorageService } from './seaweedfs-storage.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  CreateBucketCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
  DeleteObjectCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
  GetObjectCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
  HeadBucketCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
  PutObjectCommand: jest
    .fn()
    .mockImplementation((input: unknown) => ({ input })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const mockS3Client = jest.mocked(S3Client);
const mockGetSignedUrl = jest.mocked(getSignedUrl);

function configService(): ConfigService<Env, true> {
  const values: Env = {
    NODE_ENV: Environment.Test,
    PORT: 3000,
    DATABASE_URL: 'postgresql://advisory:password@localhost:5432/advisory',
    BETTER_AUTH_SECRET: 'a'.repeat(32),
    BETTER_AUTH_URL: 'http://localhost:3000',
    TRUSTED_ORIGINS: ['http://localhost:3001'],
    SMTP_URL: undefined,
    SMTP_FROM: undefined,
    ELASTICSEARCH_NODE: 'http://localhost:9200',
    ELASTICSEARCH_REQUEST_TIMEOUT_MS: 1000,
    ELASTICSEARCH_API_KEY: undefined,
    SEAWEEDFS_S3_ENDPOINT: 'seaweedfs.test',
    SEAWEEDFS_S3_PORT: 8333,
    SEAWEEDFS_S3_USE_SSL: false,
    SEAWEEDFS_S3_ACCESS_KEY: 'seaweedfsadmin',
    SEAWEEDFS_S3_SECRET_KEY: 'seaweedfsadmin',
    SEAWEEDFS_S3_BUCKET: 'advisory-platform',
    SEAWEEDFS_S3_REGION: 'us-east-1',
    OMISE_PUBLIC_KEY: '',
    OMISE_SECRET_KEY: '',
    CURRENCY_CODE: 'thb',
  };

  return {
    get: jest.fn((key: keyof Env) => values[key]),
  } as unknown as ConfigService<Env, true>;
}

describe('SeaweedFsStorageService', () => {
  let service: SeaweedFsStorageService;

  beforeEach(() => {
    mockSend.mockReset();
    mockS3Client.mockClear();
    mockS3Client.mockImplementation(
      () => ({ send: mockSend }) as unknown as S3Client,
    );
    mockGetSignedUrl.mockReset();
    service = new SeaweedFsStorageService(configService());
  });

  it('creates a missing bucket once before uploading an object', async () => {
    mockSend
      .mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } })
      .mockResolvedValue(undefined);

    await service.putObject({
      key: 'avatars/user/avatar.webp',
      body: Buffer.from('image'),
      contentType: 'image/webp',
    });

    expect(mockS3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'http://seaweedfs.test:8333',
        forcePathStyle: true,
      }),
    );
    expect(mockSend).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ input: { Bucket: 'advisory-platform' } }),
    );
    expect(mockSend).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ input: { Bucket: 'advisory-platform' } }),
    );
    expect(mockSend).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        input: {
          Bucket: 'advisory-platform',
          Key: 'avatars/user/avatar.webp',
          Body: Buffer.from('image'),
          ContentType: 'image/webp',
        },
      }),
    );
  });

  it('returns a signed download URL after confirming the bucket', async () => {
    mockSend.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue('https://seaweedfs.test/signed-url');

    await expect(
      service.createDownloadUrl('avatars/user/avatar.webp', 300),
    ).resolves.toBe('https://seaweedfs.test/signed-url');

    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: {
          Bucket: 'advisory-platform',
          Key: 'avatars/user/avatar.webp',
        },
      }),
      { expiresIn: 300 },
    );
  });

  it('does not attempt bucket creation when the gateway returns another error', async () => {
    const unavailable = new Error('gateway unavailable');
    mockSend.mockRejectedValue(unavailable);

    await expect(service.removeObject('avatars/user/avatar.webp')).rejects.toBe(
      unavailable,
    );
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
