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
  @ApiGetOne(DummyResponseDto)
  findOne(): void {}

  @Get()
  @ApiGetPaginated(DummyResponseDto, { public: true })
  findMany(): void {}

  @Post()
  @ApiCreate(DummyResponseDto, { name: 'Test dummy' })
  create(): void {}

  @Delete(':id')
  @ApiDelete(DummyResponseDto)
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
    expect(getOne).toMatchObject({ description: 'Dummy found' });
    expect(
      document.paths['/dummies/{id}']?.get?.responses?.['401'],
    ).toBeDefined();
    expect(
      document.paths['/dummies/{id}']?.get?.responses?.['403'],
    ).toBeDefined();
    expect(document.paths['/dummies/{id}']?.get?.security).toBeUndefined();
    expect(document.paths['/dummies/{id}']?.get?.summary).toBeUndefined();

    const getManyOperation = document.paths['/dummies']?.get;
    expect(getManyOperation?.responses?.['200']).toMatchObject({
      description: 'Paginated list of Dummy',
    });
    expect(getManyOperation?.responses?.['401']).toBeUndefined();
    expect(getManyOperation?.security).toBeUndefined();
    expect(getManyOperation?.summary).toBe(
      'Public — no authentication required',
    );

    const create = document.paths['/dummies']?.post?.responses?.['201'];
    expect(create).toMatchObject({ description: 'Test dummy created' });

    const deleted = document.paths['/dummies/{id}']?.delete?.responses?.['200'];
    expect(deleted).toMatchObject({
      description: 'Dummy deleted',
      content: {
        'application/json': {
          schema: {
            allOf: [
              { $ref: '#/components/schemas/ApiEnvelopeDto' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/DummyResponseDto' },
                },
              },
            ],
          },
        },
      },
    });
  });
});
