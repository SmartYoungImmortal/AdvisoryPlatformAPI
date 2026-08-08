import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiProperty,
  ApiResponseOptions,
  getSchemaPath,
} from '@nestjs/swagger';
import { SESSION_COOKIE_NAME } from '../../modules/auth/auth.constants';

// `SchemaObject` itself isn't re-exported from the package root (see
// @nestjs/swagger/dist/interfaces/index.d.ts), so the schema shape is inferred
// structurally from the one place it is public: ApiResponseOptions['schema'].
type ResponseSchema = Extract<
  ApiResponseOptions,
  { schema: unknown }
>['schema'];

// These two classes exist only as Swagger schema shapes for `getSchemaPath` — never
// instantiated with `new`, so the fields are declared, not assigned.
export class ApiEnvelopeDto {
  @ApiProperty() statusCode!: number;
  @ApiProperty() message!: string;
}

export class ApiPaginatedDataDto {
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() totalPages!: number;
}

function envelopeSchema(model: Type): ResponseSchema {
  return {
    allOf: [
      { $ref: getSchemaPath(ApiEnvelopeDto) },
      { properties: { data: { $ref: getSchemaPath(model) } } },
    ],
  };
}

function paginatedEnvelopeSchema(model: Type): ResponseSchema {
  return {
    allOf: [
      { $ref: getSchemaPath(ApiEnvelopeDto) },
      {
        properties: {
          data: {
            allOf: [
              { $ref: getSchemaPath(ApiPaginatedDataDto) },
              {
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                },
              },
            ],
          },
        },
      },
    ],
  };
}

export interface ApiReadOptions {
  /**
   * Defaults to `false` — SessionGuard fails closed (a route is protected unless
   * `@Public()` says otherwise), so the docs default the same way. Pass `true` only
   * for a handler that actually carries `@Public()`.
   */
  public?: boolean;
}

/** `[]` on a public route, `[ApiCookieAuth(...)]` otherwise — the one place that decides it. */
function authDecorators(isPublic: boolean | undefined): MethodDecorator[] {
  return isPublic ? [] : [ApiCookieAuth(SESSION_COOKIE_NAME)];
}

export function ApiGetOne(
  model: Type,
  name: string,
  options: ApiReadOptions = {},
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ApiEnvelopeDto, model),
    ApiOkResponse({
      description: `${name} found`,
      schema: envelopeSchema(model),
    }),
    ApiNotFoundResponse({ description: `${name} not found` }),
    ...authDecorators(options.public),
  );
}

export function ApiGetPaginated(
  model: Type,
  name: string,
  options: ApiReadOptions = {},
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ApiEnvelopeDto, ApiPaginatedDataDto, model),
    ApiOkResponse({
      description: `Paginated list of ${name}`,
      schema: paginatedEnvelopeSchema(model),
    }),
    ...authDecorators(options.public),
  );
}

export function ApiCreate(model: Type, name: string): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ApiEnvelopeDto, model),
    ApiCreatedResponse({
      description: `${name} created`,
      schema: envelopeSchema(model),
    }),
    ApiCookieAuth(SESSION_COOKIE_NAME),
  );
}

export function ApiUpdate(model: Type, name: string): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ApiEnvelopeDto, model),
    ApiOkResponse({
      description: `${name} updated`,
      schema: envelopeSchema(model),
    }),
    ApiNotFoundResponse({ description: `${name} not found` }),
    ApiCookieAuth(SESSION_COOKIE_NAME),
  );
}

export function ApiDelete(name: string): MethodDecorator {
  return applyDecorators(
    ApiOkResponse({ description: `${name} deleted` }),
    ApiNotFoundResponse({ description: `${name} not found` }),
    ApiCookieAuth(SESSION_COOKIE_NAME),
  );
}
