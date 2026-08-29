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

import type { SessionUser } from '@/modules/auth/auth.config';
import { AdvisorServicesController } from './advisor-services.controller';
import type { AdvisorServicesService } from './advisor-services.service';
import { AdvisorServiceQueryDto } from './dtos/advisor-service-query.dto';
import type { CreateAdvisorServiceDto } from './dtos/create-advisor-service.dto';
import type { UpdateAdvisorServiceDto } from './dtos/update-advisor-service.dto';

const user = { id: '11111111-1111-1111-1111-111111111111' } as SessionUser;
const serviceId = '22222222-2222-2222-2222-222222222222';

describe('AdvisorServicesController', () => {
  let controller: AdvisorServicesController;
  let service: jest.Mocked<AdvisorServicesService>;

  beforeEach(() => {
    service = {
      findMany: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AdvisorServicesService>;
    controller = new AdvisorServicesController(service);
  });

  it('delegates the paginated own-service list using the session user', () => {
    const query = new AdvisorServiceQueryDto();
    const result = Promise.resolve({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    service.findMany.mockReturnValue(result);

    expect(controller.findMany(user, query)).toBe(result);
    expect(service.findMany).toHaveBeenCalledWith(user, query);
  });

  it('delegates an owned-service read using the session user', () => {
    const result = Promise.resolve({ id: serviceId });
    service.findOne.mockReturnValue(
      result as ReturnType<AdvisorServicesService['findOne']>,
    );

    expect(controller.findOne(user, serviceId)).toBe(result);
    expect(service.findOne).toHaveBeenCalledWith(user, serviceId);
  });

  it('delegates service creation using the session user', () => {
    const dto = {
      categoryId: '33333333-3333-3333-3333-333333333333',
      availabilityProfileId: '44444444-4444-4444-4444-444444444444',
      name: 'Career coaching',
      priceSatang: 150000,
      durationMinutes: 60,
    } as CreateAdvisorServiceDto;
    const result = Promise.resolve({ id: serviceId });
    service.create.mockReturnValue(
      result as ReturnType<AdvisorServicesService['create']>,
    );

    expect(controller.create(user, dto)).toBe(result);
    expect(service.create).toHaveBeenCalledWith(user, dto);
  });

  it('delegates service updates using the session user and route id', () => {
    const dto = { name: 'Updated coaching' } as UpdateAdvisorServiceDto;
    const result = Promise.resolve({ id: serviceId });
    service.update.mockReturnValue(
      result as ReturnType<AdvisorServicesService['update']>,
    );

    expect(controller.update(user, serviceId, dto)).toBe(result);
    expect(service.update).toHaveBeenCalledWith(user, serviceId, dto);
  });

  it('delegates service deletion using the session user and route id', () => {
    const result = Promise.resolve({ id: serviceId });
    service.delete.mockReturnValue(
      result as ReturnType<AdvisorServicesService['delete']>,
    );

    expect(controller.delete(user, serviceId)).toBe(result);
    expect(service.delete).toHaveBeenCalledWith(user, serviceId);
  });

  it.each([
    ['findMany', { permission: { advisorService: ['read'] } }],
    ['findOne', { permission: { advisorService: ['read'] } }],
    ['create', { permission: { advisorService: ['createSelf'] } }],
    ['update', { permission: { advisorService: ['update'] } }],
    ['delete', { permission: { advisorService: ['delete'] } }],
  ])('declares the required permission for %s', (method, permission) => {
    const handler =
      AdvisorServicesController.prototype[
        method as keyof AdvisorServicesController
      ];

    expect(Reflect.getMetadata('USER_HAS_PERMISSION', handler)).toEqual(
      permission,
    );
  });
});
