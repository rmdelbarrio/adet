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
    
    // FIX: Use user.password_hash (snake_case from DB)
    const valid = await bcrypt.compare(pass, user.password_hash); 
    
    if (valid) {
        // FIX: Use user.user_id (snake_case from DB) 
        return { user_id: user.user_id, username: user.username, role: user.role };
    }
    return null;
  }

  // Expects user object with snake_case fields from validateUser
  async login(user: { user_id: number; username: string; role: string }) { 
    // Payload uses 'sub' which corresponds to user_id
    const payload = { sub: user.user_id, username: user.username, role: user.role }; 
    const accessToken = this.jwtService.sign(payload);

    // create refresh token using separate secret
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret', {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });

    // Store refresh token in DB
    await this.usersService.setRefreshToken(user.user_id, refreshToken); // Use user_id

    return { accessToken, refreshToken };
  }

  // Original logout method (by userId) - kept for compatibility
  async logout(userId: number) {
    await this.usersService.setRefreshToken(userId, null);
    return { success: true, message: `User ${userId} logged out.` };
  }
  
  // New method to log out by token (used by client)
  async logoutByToken(refreshToken: string) {
    try {
        // Verify token to get userId
        const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret');
        const userId = decoded.sub; // sub is the user_id

        const foundUser = await this.usersService.findByRefreshToken(refreshToken);

        // FIX: Compare found.user_id (from service) with userId (from JWT sub)
        if (foundUser && foundUser.user_id === userId) { 
            await this.usersService.setRefreshToken(userId, null);
            return { success: true, message: `User ${userId} session revoked.` };
        } else {
            throw new UnauthorizedException('Invalid or revoked refresh token');
        }
    } catch (err) {
        console.error("Logout error:", err);
        throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }


  async refreshTokens(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret');
      
      const found = await this.usersService.findByRefreshToken(refreshToken);
      if (!found) throw new UnauthorizedException('Invalid refresh token (not found)');

      // FIX: Compare found.user_id (from service) with decoded.sub (from JWT)
      if (found.user_id !== decoded.sub) throw new UnauthorizedException('Refresh token payload mismatch.');

      // Payload uses found.user_id
      const payload = { sub: found.user_id, username: found.username, role: found.role }; 
      const accessToken = this.jwtService.sign(payload);
      
      // Generate new refresh token
      const newRefresh = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_secret', {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
      });
      
      // Update DB with the new refresh token (for rotation/invalidation)
      await this.usersService.setRefreshToken(found.user_id, newRefresh);
      
      return { accessToken, refreshToken: newRefresh };
    } catch (err) {
      throw new UnauthorizedException('Could not refresh tokens');
    }
  }
}
