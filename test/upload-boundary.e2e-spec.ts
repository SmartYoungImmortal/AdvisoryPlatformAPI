import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ChatFilesController } from '@/modules/chat/chat-files.controller';
import { ChatFilesService } from '@/modules/chat/chat-files.service';
import { AdvisorIdentityVerificationController } from '@/modules/identity-verification/advisor-identity-verification.controller';
import { IdentityVerificationService } from '@/modules/identity-verification/identity-verification.service';
import { AdvisorSkillProofsController } from '@/modules/skill-proofs/advisor-skill-proofs.controller';
import { SkillProofsService } from '@/modules/skill-proofs/skill-proofs.service';

describe('multipart upload maximum through production controllers', () => {
  let app: NestExpressApplication;
  const maximum = 50 * 1024 * 1024;
  const receivedSizes: number[] = [];

  function receive(file: Express.Multer.File | undefined) {
    if (!file) throw new Error('Expected a multipart file');
    receivedSizes.push(file.size);
    return { fileSizeBytes: file.size };
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        ChatFilesController,
        AdvisorIdentityVerificationController,
        AdvisorSkillProofsController,
      ],
      providers: [
        {
          provide: ChatFilesService,
          useValue: {
            upload: (
              _user: unknown,
              _room: unknown,
              file: Express.Multer.File | undefined,
            ) => receive(file),
          },
        },
        {
          provide: IdentityVerificationService,
          useValue: {
            submit: (_user: unknown, file: Express.Multer.File | undefined) =>
              receive(file),
          },
        },
        {
          provide: SkillProofsService,
          useValue: {
            submit: (
              _user: unknown,
              _dto: unknown,
              file: Express.Multer.File | undefined,
            ) => receive(file),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      Object.assign(req, {
        user: { id: '11111111-1111-4111-8111-111111111111' },
      });
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['/chat/rooms/22222222-2222-4222-8222-222222222222/files', 'file'],
    ['/advisors/me/identity-verification', 'document'],
    ['/advisors/me/skill-proofs', 'file'],
  ])(
    '%s accepts exactly 50 MiB and rejects the next byte',
    async (path, field) => {
      receivedSizes.length = 0;
      await request(app.getHttpServer())
        .post(path)
        .attach(field, Buffer.alloc(maximum, 0x61), {
          filename: 'proof.png',
          contentType: 'image/png',
        })
        .expect(201)
        .expect({ fileSizeBytes: maximum });
      await request(app.getHttpServer())
        .post(path)
        .attach(field, Buffer.alloc(maximum + 1, 0x61), {
          filename: 'proof.png',
          contentType: 'image/png',
        })
        .expect(413);
      expect(receivedSizes).toEqual([maximum]);
    },
  );
});
