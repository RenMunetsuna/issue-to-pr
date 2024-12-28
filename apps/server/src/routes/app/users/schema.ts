import { z } from 'zod';
import type { JSONSchema } from 'json-schema-to-ts';
import type { GenerateRequestTypes, GenerateResponseTypes } from '@/types';

const createUserSchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      role: { type: 'string', enum: ['admin', 'user'] }
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
        role: { type: 'string' },
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
    } as const satisfies JSONSchema
  }
} as const satisfies JSONSchema;

export const schemas = {
  post: createUserSchema
};

export type CreateUserRequest = GenerateRequestTypes<typeof createUserSchema>;
export type CreateUserResponse = GenerateResponseTypes<
  typeof createUserSchema.response
>;