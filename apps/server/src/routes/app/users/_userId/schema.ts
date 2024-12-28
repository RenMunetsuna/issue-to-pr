import type { JSONSchema } from 'json-schema-to-ts';
import type { GenerateRequestTypes, GenerateResponseTypes } from '@/types';

export const schemas = {
  get: {
    tags: ['user'],
    description: 'ユーザー情報取得',
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
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          profile: {
            type: 'object',
            properties: {
              bio: { type: 'string', nullable: true },
              avatar: { type: 'string', nullable: true },
              birthDate: { type: 'string', nullable: true },
              location: { type: 'string', nullable: true }
            },
            required: ['bio', 'avatar', 'birthDate', 'location']
          },
          comments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                createdAt: { type: 'number' }
              },
              required: ['id', 'content', 'createdAt']
            }
          },
          createdAt: { type: 'number' }
        },
        required: ['id', 'email', 'name', 'profile', 'comments', 'createdAt']
      } as const satisfies JSONSchema,
      404: {
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

export type GetUserRequest = GenerateRequestTypes<typeof schemas.get>;
export type GetUserResponse = GenerateResponseTypes<
  typeof schemas.get.response
>;
