import type { CreateUserRequest } from './schema';

export const extractParamsForCreateUser = (request: CreateUserRequest): {
  email: string;
  name: string;
  role: string;
} => {
  const { email, name, role } = request.body;
  return { email, name, role };
};