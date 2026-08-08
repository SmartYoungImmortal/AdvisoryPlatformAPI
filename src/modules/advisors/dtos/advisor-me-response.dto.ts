import { ApiProperty } from '@nestjs/swagger';
import type { SessionUser } from '../../auth/auth.config';

export class AdvisorMeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() displayName: string;
  @ApiProperty() email: string;
  @ApiProperty({
    description: 'Whether this user has completed advisor onboarding',
  })
  isAdvisor: boolean;

  constructor(user: SessionUser, isAdvisor: boolean) {
    this.id = user.id;
    // better-auth's TS surface always calls this field `name` — `user.fields.name` in
    // auth.config.ts only remaps which Drizzle column it reads/writes, not this type.
    this.displayName = user.name;
    this.email = user.email;
    this.isAdvisor = isAdvisor;
  }
}
