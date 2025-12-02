import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module'; // Required for Guards

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [DashboardController],
  providers: [],
})
export class DashboardModule {}
