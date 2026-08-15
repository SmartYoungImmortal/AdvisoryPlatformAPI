import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { ENV_KEYS } from './config/env.constants';
import type { Env } from './config/env.schema';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationException } from './common/utils/validation.exception';

/** Applies every runtime HTTP behavior that endpoint tests must exercise. */
export function configureApp(app: NestExpressApplication): void {
  const jsonParser = json();
  const urlencodedParser = urlencoded({ extended: true });
  app.use(
    (
      req: Parameters<typeof jsonParser>[0],
      res: Parameters<typeof jsonParser>[1],
      next: () => void,
    ) => {
      const requestPath = (req.originalUrl ?? req.url ?? '').split('?', 1)[0];
      if (requestPath === '/api/auth' || requestPath.startsWith('/api/auth/')) {
        next();
        return;
      }
      jsonParser(req, res, () => urlencodedParser(req, res, next));
    },
  );

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  app.enableCors({
    origin: config.get(ENV_KEYS.TRUSTED_ORIGINS, { infer: true }),
    credentials: true,
  });
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
}

export function configureSwagger(app: NestExpressApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Advisory Platform API')
    .setDescription('Backend API for the Advisory Platform')
    .setVersion('0.0.1')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
}
