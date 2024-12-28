import type { FastifyRequest } from 'fastify';
import type { Result } from '@/types';
import type { GetUserRequest } from './schema';
import { validateCuid } from '@/utils/validate';

export const extractParamsForGetUser = (
  request: FastifyRequest<GetUserRequest>
): Result<
  {
    userId: string;
  },
  {
    errorCode: 400;
  }
> => {
  const { userId } = request.params;

  return validateCuid(userId)
    ? { success: true, data: { userId } }
    : { success: false, error: { errorCode: 400 } };
};
