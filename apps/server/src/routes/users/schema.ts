import type { JSONSchema } from 'json-schema-to-ts';
import type { Role } from '@prisma/client';
import type { GenerateRequestTypes, GenerateResponseTypes } from '@/types';

export const schemas = {
  post: {
    tags: ['user'],
    description: 'ユーザー作成API',
    body: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 1, maxLength: 100 },
        role: { 
          type: 'string', 
          enum: ['USER', 'ADMIN'] 
        }
      },
      required: ['email', 'name', 'role']
    } as const satisfies JSONSchema,
    headers: {
      type: 'object',
      properties: {
        authorization: { type: 'string' },
        'x-device-id': { type: 'string' }
      },
      required: ['authorization', 'x-device-id']
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
            enum: ['USER', 'ADMIN'] 
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
      409: {
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