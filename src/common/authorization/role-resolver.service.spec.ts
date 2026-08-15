import { Role } from '../decorators/roles.decorator';
import type { RoleRepository } from './role.repository';
import { RoleResolver } from './role-resolver.service';

describe('RoleResolver', () => {
  it.each([
    [false, false, [Role.Advisee]],
    [true, false, [Role.Advisee, Role.Advisor]],
    [false, true, [Role.Advisee, Role.Admin]],
    [true, true, [Role.Advisee, Role.Advisor, Role.Admin]],
  ])(
    'resolves additive roles in stable order',
    async (isAdvisor, isAdmin, expected) => {
      const roleRepository = {
        findMembership: jest.fn().mockResolvedValue({ isAdvisor, isAdmin }),
      };
      const resolver = new RoleResolver(
        roleRepository as unknown as RoleRepository,
      );

      await expect(resolver.resolve('user-id')).resolves.toEqual(expected);
      expect(roleRepository.findMembership).toHaveBeenCalledWith('user-id');
    },
  );
});
