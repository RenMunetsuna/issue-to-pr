import type { FastifyInstance } from 'fastify';
import { pipe } from 'ramda';
import { match } from 'ts-pattern';
import { extractParamsForGetUser } from './extractParamsForGetUser';
import { getUserFromDB } from './getUserFromDB';
import type { GetUserRequest, GetUserResponse } from './schema';
import { schemas } from './schema';
import { bypass, dbMiddleware, start, verifyUser } from '@/utils';

export default async function (fastify: FastifyInstance) {
  /*
   * GET: /app/users/:userId
   */
  /* eslint-disable-next-line functional/no-expression-statements */
  fastify.get<{
    Headers: GetUserRequest['Headers'];
    Params: GetUserRequest['Params'];
    Reply: GetUserResponse;
  }>(
    '/',
    {
      preHandler: verifyUser,
      schema: schemas['get']
    },
    async (request, reply) => {
      const getUser = dbMiddleware(getUserFromDB);
      return pipe(
        start(extractParamsForGetUser(request)),
        bypass(getUser),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 400 } }, () => {
              return reply.code(500).send({ error: 'リクエスト値が不正です' });
            })
            .with({ error: { errorCode: 600 } }, () => {
              return reply.code(404).send({
                error: 'ユーザーが存在しません'
              });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive()
      )();
    }
  );
}
