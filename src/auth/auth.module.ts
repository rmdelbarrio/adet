import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { Reflector } from '@nestjs/core'; // Import Reflector

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '60s' },
    }),
  ],
  controllers: [AuthController],
  // FIX: Add Reflector and JwtStrategy to providers/exports
  providers: [AuthService, JwtStrategy, Reflector],
  exports: [AuthService, JwtModule, Reflector],
})
export class AuthModule {}
