import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

export const User = createParamDecorator((data: keyof RequestWithUser['user'] | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  const user = request.user;

  if (!user) {
    return undefined;
  }

  return data ? user[data] : user;
});
