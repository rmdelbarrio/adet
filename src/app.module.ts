//added appcontroller and made a .ts file for it

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { PositionModule } from './position/position.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule,PositionModule],

  controllers: [AppController],
})
export class AppModule {}
