import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../src/users/users.service';

const extractJwtFromCookie = (req: any) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['accessToken'];
    }
    return token;
}; 

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: extractJwtFromCookie, // Look for JWT in the 'accessToken' cookie
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'secret_key',
        });
    }

    // FIX: Ensure the 'role' is included in the validated payload
    async validate(payload: any) {
        // Fetch user from DB or trust payload if user data is minimal (we'll fetch for safety)
        const user = await this.usersService.findById(payload.sub); 

        if (!user) {
            throw new UnauthorizedException();
        }

        // Return the minimal user object including the role
        return { 
            user_id: payload.sub, 
            username: payload.username, 
            role: payload.role // CRITICAL: Pass the role forward
        };
    }
}
