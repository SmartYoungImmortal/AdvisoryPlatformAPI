jest.mock('@thallesp/nestjs-better-auth', () => ({
  Roles:
    (roles: string[]) =>
    (_target: object, _key: string, descriptor: PropertyDescriptor) => {
      const handler: unknown = descriptor.value;
      if (typeof handler === 'function') {
        Reflect.defineMetadata('ROLES', roles, handler);
      }
    },
}));

import { ServiceSlotsController } from './service-slots.controller';

describe('ServiceSlotsController authorization', () => {
  const handler = ServiceSlotsController.prototype.findSlots;

  it.each([
    ['advisee', true],
    ['advisor', false],
    ['admin', false],
  ])('allows %s access: %s', (role, allowed) => {
    const requiredRoles = Reflect.getMetadata('ROLES', handler) as string[];

    expect(requiredRoles).toEqual(['advisee']);
    expect(requiredRoles.includes(role)).toBe(allowed);
  });
});
