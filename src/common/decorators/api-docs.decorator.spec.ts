import {
  Controller,
  Delete,
  Get,
  INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApiProperty, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiDelete,
  ApiGetOne,
  ApiGetPaginated,
} from './api-docs.decorator';

class DummyResponseDto {
  @ApiProperty() id!: string;
}

@Controller('dummies')
class DummyController {
  @Get(':id')
  @ApiGetOne(DummyResponseDto, 'Dummy')
  findOne(): void {}

  @Get()
  @ApiGetPaginated(DummyResponseDto, 'Dummy', { public: true })
  findMany(): void {}

  @Post()
  @ApiCreate(DummyResponseDto, 'Dummy')
  create(): void {}

  @Delete(':id')
  @ApiDelete('Dummy')
  delete(): void {}
}

@Module({ controllers: [DummyController] })
class DummyModule {}

describe('api-docs decorators', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DummyModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('composes a valid OpenAPI document with the envelope wired around the model', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );

    expect(document.components?.schemas?.DummyResponseDto).toBeDefined();
    expect(document.components?.schemas?.ApiEnvelopeDto).toBeDefined();

    const getOne = document.paths['/dummies/{id}']?.get?.responses?.['200'];
    expect(getOne).toBeDefined();
    expect(
      document.paths['/dummies/{id}']?.get?.responses?.['401'],
    ).toBeDefined();
    expect(
      document.paths['/dummies/{id}']?.get?.responses?.['403'],
    ).toBeDefined();
    expect(document.paths['/dummies/{id}']?.get?.security).toBeUndefined();
    expect(document.paths['/dummies/{id}']?.get?.summary).toBeUndefined();

    const getManyOperation = document.paths['/dummies']?.get;
    expect(getManyOperation?.responses?.['200']).toBeDefined();
    expect(getManyOperation?.responses?.['401']).toBeUndefined();
    expect(getManyOperation?.security).toBeUndefined();
    expect(getManyOperation?.summary).toBe(
      'Public — no authentication required',
    );

    const create = document.paths['/dummies']?.post?.responses?.['201'];
    expect(create).toBeDefined();

    const deleted = document.paths['/dummies/{id}']?.delete?.responses?.['200'];
    expect(deleted).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ApiNullDataEnvelopeDto' },
        },
      },
    });
  });
});
