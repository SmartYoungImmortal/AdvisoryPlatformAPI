import type {
  MinioStorageService,
  StoredObject,
} from '@/common/storage/minio-storage.service';

type StorageBoundary = Pick<
  MinioStorageService,
  'putObject' | 'removeObject' | 'createDownloadUrl'
>;

/**
 * In-memory replacement for the external object-storage boundary in e2e tests.
 * The application, HTTP stack, authentication, and PostgreSQL remain real.
 */
export class MinioStorageStub implements StorageBoundary {
  private readonly objects = new Map<string, StoredObject>();

  putObject(object: StoredObject): Promise<void> {
    this.objects.set(object.key, {
      ...object,
      body: Buffer.from(object.body),
    });
    return Promise.resolve();
  }

  removeObject(key: string): Promise<void> {
    this.objects.delete(key);
    return Promise.resolve();
  }

  createDownloadUrl(key: string, expirySeconds: number): Promise<string> {
    return Promise.resolve(
      `https://storage.example.test/${encodeURIComponent(key)}?expires=${expirySeconds}`,
    );
  }

  getObject(key: string): StoredObject | undefined {
    const object = this.objects.get(key);
    return object
      ? {
          ...object,
          body: Buffer.from(object.body),
        }
      : undefined;
  }

  hasObject(key: string): boolean {
    return this.objects.has(key);
  }

  clear(): void {
    this.objects.clear();
  }
}
