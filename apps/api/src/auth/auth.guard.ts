import type { UserRole } from '@allfina/shared';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { AUTH, type Auth } from './auth';
import { IS_PUBLIC } from './decorators';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firmId: string;
  role: UserRole;
}

export type AuthenticatedRequest = Request & { user: AuthUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const result = await this.auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!result) throw new UnauthorizedException();

    const { user } = result;
    if (!user.firmId) throw new ForbiddenException('User is not assigned to a firm');

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      firmId: user.firmId,
      role: (user.role ?? 'advisor') as UserRole,
    };
    return true;
  }
}
