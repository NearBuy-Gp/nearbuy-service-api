import { Request } from 'express';
import { Role } from '../../utils/enums/user-role.enum';

/**
 * Extended Express Request interface with typed user property
 * This replaces the unsafe req['user'] pattern
 */
export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}
