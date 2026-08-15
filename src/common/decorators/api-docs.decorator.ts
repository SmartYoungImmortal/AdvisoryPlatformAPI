import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { ApiResponseOptions } from '@nestjs/swagger';

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

export class ApiNullDataEnvelopeDto extends ApiEnvelopeDto {
  @ApiProperty({ type: () => Object, nullable: true, example: null })
  data!: null;
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
  return isPublic
    ? [
        ApiOperation({
          summary: 'Public — no authentication required',
        }),
      ]
    : [
        ApiExtraModels(ApiNullDataEnvelopeDto),
        ApiUnauthorizedResponse({
          description:
            'No valid session. This API uses a Better Auth HttpOnly session cookie; Swagger cannot accept a pasted session value. Use Postman or establish the browser session before executing this endpoint in Swagger.',
          type: ApiNullDataEnvelopeDto,
        }),
        ApiForbiddenResponse({
          description: 'Session valid but role or ownership is not permitted',
          type: ApiNullDataEnvelopeDto,
        }),
      ];
}

export function ApiGetOne(
  model: Type,
  name: string,
  options: ApiReadOptions = {},
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ApiEnvelopeDto, ApiNullDataEnvelopeDto, model),
    ApiOkResponse({
      description: `${name} found`,
      schema: envelopeSchema(model),
    }),
    ApiNotFoundResponse({
      description: `${name} not found`,
      type: ApiNullDataEnvelopeDto,
    }),
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
    ApiExtraModels(ApiEnvelopeDto, ApiNullDataEnvelopeDto, model),
    ApiCreatedResponse({
      description: `${name} created`,
      schema: envelopeSchema(model),
    }),
    ...authDecorators(false),
  );
}

export function ApiUpdate(model: Type, name: string): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ApiEnvelopeDto, model),
    ApiOkResponse({
      description: `${name} updated`,
      schema: envelopeSchema(model),
    }),
    ApiNotFoundResponse({
      description: `${name} not found`,
      type: ApiNullDataEnvelopeDto,
    }),
    ...authDecorators(false),
  );
}

export function ApiDelete(name: string): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ApiNullDataEnvelopeDto),
    ApiOkResponse({
      description: `${name} deleted`,
      type: ApiNullDataEnvelopeDto,
    }),
    ApiNotFoundResponse({
      description: `${name} not found`,
      type: ApiNullDataEnvelopeDto,
    }),
    ...authDecorators(false),
  );
}
