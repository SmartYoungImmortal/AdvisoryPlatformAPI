import { Inject, Injectable } from '@nestjs/common';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { serviceCategories } from '@/database/schema';

@Injectable()
export class ServiceCategoriesRepository extends EntityRepository<
  typeof serviceCategories
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, serviceCategories);
  }
}
