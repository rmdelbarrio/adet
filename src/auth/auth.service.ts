import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async validateUser(username: string, pass: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    const valid = await bcrypt.compare(pass, user.password);
    if (valid) return { id: user.id, username: user.username, role: user.role };
    return null;
  }

  async login(user: { id: number; username: string; role: string }) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // create refresh token using separate secret so you can revoke access by changing refresh secret
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret', {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });

    // Store refresh token in DB (plain text or hashed)
    // for better security, hash the refresh token before storing. Here we’ll store plain for simplicity.
    await this.usersService.setRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async logout(userId: number) {
    await this.usersService.setRefreshToken(userId, null);
    return { ok: true };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret');
      const user = await this.usersService.findById(decoded.sub);
      if (!user) throw new UnauthorizedException('Invalid refresh token');
      // check stored token matches
      const stored = await this.usersService.findById(decoded.sub);
      const poolUser = await this.usersService.findById(decoded.sub);
      // We need to check stored refresh_token
      const u = await this.usersService.findById(decoded.sub);
      // Instead of repeated calls, use method that fetches refresh token
      const found = await this.usersService.findByRefreshToken(refreshToken);
      if (!found) throw new UnauthorizedException('Invalid refresh token (not found)');

      const payload = { sub: found.id, username: found.username, role: found.role };
      const accessToken = this.jwtService.sign(payload);
      const newRefresh = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret', {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      });
      await this.usersService.setRefreshToken(found.id, newRefresh);
      return { accessToken, refreshToken: newRefresh };
    } catch (err) {
      throw new UnauthorizedException('Could not refresh tokens');
    }
  }
}