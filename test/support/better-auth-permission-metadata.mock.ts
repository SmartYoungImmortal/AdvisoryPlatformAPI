export function UserHasPermission(options: unknown) {
  return (_target: object, _key: string, descriptor: PropertyDescriptor) => {
    const handler: unknown = descriptor.value;
    if (typeof handler === 'function') {
      Reflect.defineMetadata('USER_HAS_PERMISSION', options, handler);
    }
  };
}
