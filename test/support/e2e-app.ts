import type { NestExpressApplication } from '@nestjs/platform-express';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { configureApp } from '@/app.factory';
import { AppModule } from '@/app.module';
import { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { SeaweedFsStorageStub } from '../stubs/seaweedfs-storage.stub';

/** What a spec needs to drive the booted application. */
export interface E2eContext {
  app: NestExpressApplication;
  db: DrizzleDB;
}

export interface BootedE2eApp extends E2eContext {
  storage: SeaweedFsStorageStub;
}

/**
 * Boots the real application with only the object-storage boundary stubbed; the HTTP
 * stack, authentication, and PostgreSQL stay real. `configureApp` keeps middleware
 * identical to production, including the raw-body exception at `/api/auth/*`.
 */
export async function createE2eApp(): Promise<BootedE2eApp> {
  const storage = new SeaweedFsStorageStub();
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SeaweedFsStorageService)
    .useValue(storage)
    .compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>({
    bodyParser: false,
  });
  configureApp(app);
  await app.init();

  return { app, db: app.get<DrizzleDB>(DRIZZLE), storage };
}
