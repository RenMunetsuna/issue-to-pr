import { Role } from '@prisma/client';
import type { JSONSchema } from 'json-schema-to-ts';
import type { GenerateRequestTypes, GenerateResponseTypes } from '@/types';

const schemas = {
  post: {
    tags: ['user'],
    description: 'ユーザー作成',
    headers: {
      type: 'object',
      properties: {
        authorization: { type: 'string' },
        'x-device-id': { type: 'string' }
      },
      required: ['authorization', 'x-device-id']
    } as const satisfies JSONSchema,
    body: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
        role: {
          type: 'string',
          enum: Object.values(Role)
        }
      },
      required: ['email', 'name', 'role']
    } as const satisfies JSONSchema,
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: {
            type: 'string',
            enum: Object.values(Role)
          },
          createdAt: { type: 'number' }
        },
        required: ['id', 'email', 'name', 'role', 'createdAt']
      } as const satisfies JSONSchema,
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        },
        required: ['error']
      } as const satisfies JSONSchema,
      500: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        },
        required: ['error']
      } as const satisfies JSONSchema
    }
  }
};

export type CreateUserRequest = GenerateRequestTypes<typeof schemas.post>;
export type CreateUserResponse = GenerateResponseTypes<typeof schemas.post.response>;

export { schemas };