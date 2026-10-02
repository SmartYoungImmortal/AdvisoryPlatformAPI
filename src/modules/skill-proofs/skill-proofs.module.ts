import { Module } from '@nestjs/common';
import { AdminSkillProofsController } from './admin-skill-proofs.controller';
import { AdvisorSkillProofsController } from './advisor-skill-proofs.controller';
import { SkillProofsRepository } from './skill-proofs.repository';
import { SkillProofsService } from './skill-proofs.service';

@Module({
  // The literal `advisors/me/...` controller is listed first, matching the rule
  // `AdvisorsModule` and `app.module.ts` already apply: nothing here collides with
  // `advisors/:advisorId` at three segments, but the ordering costs nothing and keeps
  // one habit for every `me` route.
  controllers: [AdvisorSkillProofsController, AdminSkillProofsController],
  providers: [SkillProofsService, SkillProofsRepository],
})
export class SkillProofsModule {}
