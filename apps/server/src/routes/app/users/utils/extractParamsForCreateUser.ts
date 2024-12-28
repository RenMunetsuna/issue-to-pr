import type { CreateUserRequest } from '@/routes/app/users/_userId/schema';
import type { FastifyRequest } from 'fastify';

export const extractParamsForCreateUser = (
  request: FastifyRequest,
): CreateUserRequest['Body'] => {
  const { email, name, role } = request.body;
  return { email, name, role };
};