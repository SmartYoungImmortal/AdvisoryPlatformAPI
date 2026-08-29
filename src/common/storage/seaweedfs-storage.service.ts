import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';
import type { Env } from '@/config/env.schema';

export interface StoredObject {
  key: string;
  body: Buffer;
  contentType: string;
}

function getHttpStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('$metadata' in error)) {
    return undefined;
  }

  const metadata = error.$metadata;
  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    !('httpStatusCode' in metadata) ||
    typeof metadata.httpStatusCode !== 'number'
  ) {
    return undefined;
  }

  return metadata.httpStatusCode;
}

/**
 * The sole boundary between application code and SeaweedFS's S3-compatible gateway.
 * Database rows retain only object keys; callers generate temporary URLs only when needed.
 */
@Injectable()
export class SeaweedFsStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private bucketReady: Promise<void> | undefined;

  constructor(private readonly config: ConfigService<Env, true>) {
    const endpoint = this.getEndpoint();
    this.client = new S3Client({
      endpoint,
      region: config.get(ENV_KEYS.SEAWEEDFS_S3_REGION, { infer: true }),
      credentials: {
        accessKeyId: config.get(ENV_KEYS.SEAWEEDFS_S3_ACCESS_KEY, {
          infer: true,
        }),
        secretAccessKey: config.get(ENV_KEYS.SEAWEEDFS_S3_SECRET_KEY, {
          infer: true,
        }),
      },
      // SeaweedFS's local S3 gateway serves buckets in the request path, not a subdomain.
      forcePathStyle: true,
    });
    this.bucket = config.get(ENV_KEYS.SEAWEEDFS_S3_BUCKET, { infer: true });
  }

  async putObject(object: StoredObject): Promise<void> {
    await this.ensureBucket();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: object.key,
        Body: object.body,
        ContentType: object.contentType,
      }),
    );
  }

  async removeObject(key: string): Promise<void> {
    await this.ensureBucket();
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async createDownloadUrl(key: string, expirySeconds: number): Promise<string> {
    await this.ensureBucket();
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expirySeconds },
    );
  }

  private getEndpoint(): string {
    const protocol = this.config.get(ENV_KEYS.SEAWEEDFS_S3_USE_SSL, {
      infer: true,
    })
      ? 'https'
      : 'http';
    const host = this.config.get(ENV_KEYS.SEAWEEDFS_S3_ENDPOINT, {
      infer: true,
    });
    const port = this.config.get(ENV_KEYS.SEAWEEDFS_S3_PORT, { infer: true });

    return `${protocol}://${host}:${port}`;
  }

  private async ensureBucket(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = this.initializeBucket();
    }

    try {
      await this.bucketReady;
    } catch (error: unknown) {
      this.bucketReady = undefined;
      throw error;
    }
  }

  private async initializeBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error: unknown) {
      if (getHttpStatusCode(error) !== 404) {
        throw error;
      }

      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }
}
