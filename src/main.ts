import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ENV_KEYS } from './config/env.constants';
import { Env } from './config/env.schema';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationException } from './common/utils/validation.exception';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => new ValidationException(errors),
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Advisory Platform API')
    .setDescription('Backend API for the Advisory Platform')
    .setVersion('0.0.1')
    .addGlobalResponse(
      { status: HttpStatus.UNAUTHORIZED, description: 'No valid session' },
      {
        status: HttpStatus.FORBIDDEN,
        description: 'Session valid but role/ownership not permitted',
      },
      {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        description: 'Semantically invalid request',
      },
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.get(ENV_KEYS.PORT, { infer: true }));
}

void bootstrap();
