import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AdvisorsModule } from './modules/advisors/advisors.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ChatModule } from './modules/chat/chat.module';
import { AdvisorServicesModule } from './modules/advisor-services/advisor-services.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    AdvisorsModule,
    SkillsModule,
    ServiceCategoriesModule,
    UsersModule,
    ChatModule,
    AdvisorServicesModule,
  ],
})
export class AppModule {}
