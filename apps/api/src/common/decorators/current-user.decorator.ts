import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedUser {
  sub: string;
  tenantId: string;
  role: 'admin' | 'manager' | 'operator';
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!req.user) {
      throw new Error('CurrentUser requested but no user attached to request');
    }
    return req.user;
  },
);
