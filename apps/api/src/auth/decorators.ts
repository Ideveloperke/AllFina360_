import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AuthenticatedRequest, AuthUser } from './auth.guard';

export const IS_PUBLIC = 'isPublic';

/** Skip session authentication for a route or controller. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Inject the authenticated user into a route handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
