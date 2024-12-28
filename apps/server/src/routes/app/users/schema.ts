import { UserRole } from '@prisma/client';
import type { JSONSchema } from 'json-schema-to-ts';
import type { GenerateRequestTypes, GenerateResponseTypes } from '@/types';

export const schemas = {
  post: {
    tags: ['user'],
    description: 'プロフィール作成',
    headers: {
      type: 'object',
      properties: {
        authorization: { type: 'string' },
        'x-device-id': { type: 'string' }
      },
      required: ['authorization', 'x-device-id']
    } as const satisfies JSONSchema,
    params: {
      type: 'object',
      properties: {
        userId: { type: 'string' }
      },
      required: ['userId']
    } as const satisfies JSONSchema,
    body: {
      type: 'object',
      properties: {
        bio: { type: 'string', nullable: true },
        avatar: { type: 'string', nullable: true },
        birthDate: { type: 'string', format: 'date-time', nullable: true },
        location: { type: 'string', nullable: true }
      },
      required: []
    } as const satisfies JSONSchema,
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          bio: { type: 'string', nullable: true },
          avatar: { type: 'string', nullable: true },
          birthDate: { type: 'string', format: 'date-time', nullable: true },
          location: { type: 'string', nullable: true }
        },
        required: ['id', 'userId']
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

export type CreateProfileRequest = GenerateRequestTypes<typeof schemas.post>;
export type CreateProfileResponse = GenerateResponseTypes<
  typeof schemas.post.response
>;