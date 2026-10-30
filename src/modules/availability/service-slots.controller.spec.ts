import type { SessionUser } from '@/modules/auth/auth.config';
import type { AvailabilityService } from './availability.service';
import { ServiceSlotsController } from './service-slots.controller';

describe('ServiceSlotsController', () => {
  const user = { id: 'user-1' } as SessionUser;
  const query = { from: '2026-10-28', to: '2026-11-04' };

  it('asks for no role, so an advisor who also books sees the slots', () => {
    const handler = ServiceSlotsController.prototype.findSlots;

    expect(Reflect.getMetadataKeys(handler)).not.toContain('ROLES');
  });

  it('reads the slots for the signed-in account', async () => {
    const findSlots = jest.fn().mockResolvedValue([]);
    const controller = new ServiceSlotsController({
      findSlots,
    } as unknown as AvailabilityService);

    await expect(
      controller.findSlots(user, 'service-1', query),
    ).resolves.toEqual([]);
    expect(findSlots).toHaveBeenCalledWith('service-1', query, 'user-1');
  });
});
