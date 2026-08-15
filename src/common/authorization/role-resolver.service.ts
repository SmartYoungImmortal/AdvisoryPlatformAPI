import { Injectable } from '@nestjs/common';
import { Role } from '@/common/decorators/roles.decorator';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleResolver {
  constructor(private readonly roleRepository: RoleRepository) {}

  /**
   * Every authenticated account is an Advisee. Advisor and Admin are additive
   * memberships derived from profile rows and returned in a stable order.
   */
  async resolve(userId: string): Promise<Role[]> {
    const membership = await this.roleRepository.findMembership(userId);
    const roles = [Role.Advisee];

    if (membership.isAdvisor) {
      roles.push(Role.Advisor);
    }
    if (membership.isAdmin) {
      roles.push(Role.Admin);
    }

    return roles;
  }
}
