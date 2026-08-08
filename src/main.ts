import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ENV_KEYS } from './config/env.constants';
import { Env } from './config/env.schema';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationException } from './common/utils/validation.exception';
import { SESSION_COOKIE_NAME } from './modules/auth/auth.constants';

async function bootstrap(): Promise<void> {
  // better-auth reads the raw request body itself; a body already consumed by Nest's
  // global parser is what CLAUDE.md flags as "the failure that costs an afternoon", so
  // the parser is disabled globally and re-applied to every route except /api/auth/*.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const jsonParser = json();
  const urlencodedParser = urlencoded({ extended: true });
  app.use(
    (
      req: Parameters<typeof jsonParser>[0],
      res: Parameters<typeof jsonParser>[1],
      next: () => void,
    ) => {
      if ((req.originalUrl ?? req.url ?? '').startsWith('/api/auth')) {
        next();
        return;
      }
      jsonParser(req, res, () => urlencodedParser(req, res, next));
    },
  );

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
    .addCookieAuth(
      SESSION_COOKIE_NAME,
      {
        type: 'apiKey',
        in: 'cookie',
        name: SESSION_COOKIE_NAME,
        description:
          'Session cookie issued by POST /api/auth/sign-in/email. Not settable from "Authorize" — sign in via a real request and the browser carries it.',
      },
      SESSION_COOKIE_NAME,
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(config.get(ENV_KEYS.PORT, { infer: true }));
}

void bootstrap();
