import type { FastifyRequest } from 'fastify';
import type { CreateProfileRequest } from './schema';
import { validateBody } from '@/utils/validate';

export const extractParamsForCreateProfile = (
  request: FastifyRequest
): CreateProfileRequest => {
  const { headers, params, body } = request;
  const { error, value } = validateBody(body, schemas.post.body);

  if (error) {
    return {
      headers,
      params,
      body: {
        error: { errorCode: 400 }
      }
    };
  }

  return {
    headers,
    params,
    body: value
  };
};