import { Role } from '@prisma/client';
import type { JSONSchema } from 'json-schema-to-ts';
import type { GenerateRequestTypes, GenerateResponseTypes } from '@/types';

const headerSchema = {
  type: 'object',
  properties: {
    authorization: { type: 'string' },
    'x-device-id': { type: 'string' }
  },
  required: ['authorization', 'x-device-id']
} as const satisfies JSONSchema;

const bodySchema = {
  type: 'object',
  properties: {
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', enum: Object.values(Role) }
  },
  required: ['email', 'name', 'role']
} as const satisfies JSONSchema;

const responseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', enum: Object.values(Role) },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' }
  },
  required: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt']
} as const satisfies JSONSchema;

export const schemas = {
  post: {
    tags: ['user'],
    description: 'ユーザー作成',
    headers: headerSchema,
    body: bodySchema,
    response: {
      200: responseSchema,
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
        description: 'サーバーエラー',
        type: 'object',
        properties: {
          error: { type: 'string', enum: ['Internal Server Error'] },
          errorSubCode: { type: 'number' },
          errorSubMessage: { type: 'string', enum: ['FITSHOP API Error'] }
        },
        required: ['error']
      } as const satisfies JSONSchema
    }
  }
};

export type CreateUserRequest = GenerateRequestTypes<typeof schemas.post>;
export type CreateUserResponse = GenerateResponseTypes<typeof schemas.post.response>;