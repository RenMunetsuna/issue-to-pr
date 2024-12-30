import type { FastifyInstance } from 'fastify';
import { pipe } from 'ramda';
import { match } from 'ts-pattern';
import { extractParamsForCreateUser } from './extractParamsForCreateUser';
import { createUserInDB } from './createUserInDB';
import type { CreateUserRequest, CreateUserResponse } from './schema';
import { schemas } from './schema';
import { bypass, dbMiddleware, start, verifyUser } from '@/utils';

export default async function (fastify: FastifyInstance) {
  /* eslint-disable-next-line functional/no-expression-statements */
  fastify.post<{
    Body: CreateUserRequest['Body'];
    Reply: CreateUserResponse;
  }>(
    '/',
    {
      preHandler: verifyUser,
      schema: schemas.post
    },
    async (request, reply) => {
      const createUser = dbMiddleware(createUserInDB);
      return pipe(
        start(extractParamsForCreateUser(request)),
        bypass(createUser),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 400 } }, () => {
              return reply.code(400).send({ error: '無効なリクエストパラメータです' });
            })
            .with({ error: { errorCode: 409 } }, () => {
              return reply.code(409).send({ error: '既に登録されているメールアドレスです' });
            })
            .with({ error: { errorCode: 500 } }, () => {
              return reply.code(500).send({ error: 'システムエラーが発生しました' });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive()
      )();
    }
  );
}