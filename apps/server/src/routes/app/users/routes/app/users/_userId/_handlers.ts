import type { FastifyInstance } from 'fastify';
import { match, P } from 'ts-pattern';
import { createUserInDB } from './createUserInDB';
import { extractParamsForCreateUser } from './extractParamsForCreateUser';
import { schemas } from './schema';
import { verifyUser, bypass, dbMiddleware, start } from '@/utils';

export default async function (fastify: FastifyInstance) {
  fastify.post<{
    Headers: {
      authorization: string;
      'x-device-id': string;
    };
    Body: {
      email: string;
      name: string;
      role: 'USER' | 'ADMIN';
    };
    Reply: {
      id: string;
      email: string;
      name: string;
      role: 'USER' | 'ADMIN';
      createdAt: number;
    };
  }>(
    '/',
    {
      preHandler: verifyUser,
      schema: schemas.post,
    },
    async (request, reply) => {
      const createUser = dbMiddleware(createUserInDB);
      return pipe(
        start(extractParamsForCreateUser(request)),
        bypass(createUser),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 400 } }, () => {
              return reply.code(400).send({ error: 'リクエスト値が不正です' });
            })
            .with({ error: { errorCode: 630 } }, () => {
              return reply.code(409).send({ error: 'ユーザーが既に存在します' });
            })
            .with({ error: { errorCode: 800 } }, () => {
              return reply.code(500).send({ error: 'Internal Server Error' });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive(),
      )();
    },
  );
}