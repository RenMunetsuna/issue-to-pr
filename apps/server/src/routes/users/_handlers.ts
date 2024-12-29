import type { FastifyInstance } from 'fastify';
import { pipe } from 'ramda';
import { match, P } from 'ts-pattern';
import { createUserInDB } from './createUserInDB';
import { extractParamsForCreateUser } from './extractParamsForCreateUser';
import type { CreateUserRequest, CreateUserResponse } from './schema';
import { schemas } from './schema';
import { bypass, dbMiddleware, start, verifyUser } from '@/utils';

export default async function (fastify: FastifyInstance) {
  /* eslint-disable-next-line functional/no-expression-statements */
  fastify.post<{
    Headers: CreateUserRequest['Headers'];
    Body: CreateUserRequest['Body'];
    Reply: CreateUserResponse;
  }>(
    '/',
    {
      schema: schemas.post,
      preHandler: verifyUser
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
            .with({ error: { errorCode: 600 } }, () => {
              return reply
                .code(409)
                .send({ error: 'このメールアドレスは既に使用されています' });
            })
            .with({ error: { errorCode: 610 } }, () => {
              return reply.code(500).send({ error: 'Internal Server Error' });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive()
      )();
    }
  );
}