import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PositionModule } from './position/position.module';
import { DatabaseModule } from './database/database.module';
// FIX: Import the new Dashboard module
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    AuthModule, 
    UsersModule, 
    PositionModule, 
    DatabaseModule,
    DashboardModule, // FIX: Add the Dashboard module here
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
