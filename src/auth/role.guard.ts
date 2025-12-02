import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the required roles defined by the @Roles() decorator
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    // If no roles are required, access is granted
    if (!requiredRoles) {
      return true;
    }

    // 2. Get the request object and the user payload from the JWT
    const { user } = context.switchToHttp().getRequest();
    
    // 3. Check if the user's role is one of the required roles
    // The user object comes from the validate() method in JwtStrategy
    return requiredRoles.some((role) => user.role === role);
  }
}
