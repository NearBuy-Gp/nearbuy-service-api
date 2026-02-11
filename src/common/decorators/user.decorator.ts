import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

/**
 * Custom decorator to extract the authenticated user from the request
 * Usage: @User() user or @User('id') userId
 *
 * This replaces the unsafe req['user'] pattern with type-safe access
 */
export const User = createParamDecorator((data: keyof RequestWithUser['user'] | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  const user = request.user;

  if (!user) {
    return undefined;
  }

  return data ? user[data] : user;
});
