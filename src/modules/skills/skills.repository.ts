import { Inject, Injectable } from '@nestjs/common';
import { EntityRepository } from '../../common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '../../database/database.module';
import { skills } from '../../database/schema';

@Injectable()
export class SkillsRepository extends EntityRepository<typeof skills> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, skills);
  }
}
