import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdvisorsModule } from './modules/advisors/advisors.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { UsersModule } from './modules/users/users.module';
import { ChatModule } from './modules/chat/chat.module';
import { VideoModule } from './modules/video/video.module';

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
    VideoModule,
  ],
})
export class AppModule {}
