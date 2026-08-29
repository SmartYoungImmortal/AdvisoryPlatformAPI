jest.mock('@thallesp/nestjs-better-auth', () => ({
  UserHasPermission:
    (options: unknown) =>
    (_target: object, _key: string, descriptor: PropertyDescriptor) => {
      const handler: unknown = descriptor.value;
      if (typeof handler === 'function') {
        Reflect.defineMetadata('USER_HAS_PERMISSION', options, handler);
      }
    },
}));

import { ServiceCategoriesController } from './service-categories.controller';

describe('ServiceCategoriesController authorization', () => {
  it.each([
    ['create', { permission: { serviceCategory: ['create'] } }],
    ['update', { permission: { serviceCategory: ['update'] } }],
    ['delete', { permission: { serviceCategory: ['delete'] } }],
  ])('declares the required permission for %s', (method, permission) => {
    const handler =
      ServiceCategoriesController.prototype[
        method as 'create' | 'update' | 'delete'
      ];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      permission,
    );
  });
});
