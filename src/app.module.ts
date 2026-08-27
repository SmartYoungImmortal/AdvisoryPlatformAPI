import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AdvisorsModule } from './modules/advisors/advisors.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ChatModule } from './modules/chat/chat.module';
import { MeetingsController } from './meetings/meetings.controller';
import { MeetingsModule } from './meetings/meetings.module';

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
    MeetingsModule,
  ],
  controllers: [MeetingsController],
})
export class AppModule {}
