import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { ENV_KEYS } from '@/config/env.constants';
import type { Env } from '@/config/env.schema';

export interface StoredObject {
  key: string;
  body: Buffer;
  contentType: string;
}

/**
 * The sole boundary between application code and S3-compatible object storage.
 * Database rows retain only object keys; callers generate temporary URLs only when needed.
 */
@Injectable()
export class MinioStorageService {
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private bucketReady: Promise<void> | undefined;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.client = new Minio.Client({
      endPoint: config.get(ENV_KEYS.MINIO_ENDPOINT, { infer: true }),
      port: config.get(ENV_KEYS.MINIO_PORT, { infer: true }),
      useSSL: config.get(ENV_KEYS.MINIO_USE_SSL, { infer: true }),
      accessKey: config.get(ENV_KEYS.MINIO_ACCESS_KEY, { infer: true }),
      secretKey: config.get(ENV_KEYS.MINIO_SECRET_KEY, { infer: true }),
    });
    this.bucket = config.get(ENV_KEYS.MINIO_BUCKET, { infer: true });
  }

  async putObject(object: StoredObject): Promise<void> {
    await this.ensureBucket();
    await this.client.putObject(
      this.bucket,
      object.key,
      object.body,
      undefined,
      {
        'Content-Type': object.contentType,
      },
    );
  }

  async removeObject(key: string): Promise<void> {
    await this.ensureBucket();
    await this.client.removeObject(this.bucket, key);
  }

  async createDownloadUrl(key: string, expirySeconds: number): Promise<string> {
    await this.ensureBucket();
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
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
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }
}
