import {
  Controller,
  Get,
  INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApiProperty, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiCreate, ApiGetOne, ApiGetPaginated } from './api-docs.decorator';

class DummyResponseDto {
  @ApiProperty() id!: string;
}

@Controller('dummies')
class DummyController {
  @Get(':id')
  @ApiGetOne(DummyResponseDto, 'Dummy')
  findOne(): void {}

  @Get()
  @ApiGetPaginated(DummyResponseDto, 'Dummy')
  findMany(): void {}

  @Post()
  @ApiCreate(DummyResponseDto, 'Dummy')
  create(): void {}
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

    const getMany = document.paths['/dummies']?.get?.responses?.['200'];
    expect(getMany).toBeDefined();

    const create = document.paths['/dummies']?.post?.responses?.['201'];
    expect(create).toBeDefined();
  });
});
