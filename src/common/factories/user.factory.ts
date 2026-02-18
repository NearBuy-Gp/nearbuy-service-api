// import { faker } from '@faker-js/faker';
import { Role } from 'src/utils/enums/user-role.enum';

export const createFakeUser = () => ({
  name: 'fsdfs',
  email: 'sfsdf',
  password: 'hashed-password',
  role: Role.OWNER,
});
