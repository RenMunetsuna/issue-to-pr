import type { FastifyInstance } from 'fastify';
import { pipe } from 'ramda';
import { match, P } from 'ts-pattern';
import { createUserInDB } from './createUserInDB';
import { verifyUser } from '@/utils';
import { CreateUserRequest, CreateUserResponse, schemas } from './schema';

export default async function (fastify: FastifyInstance) {
  fastify.post<{
    Headers: CreateUserRequest['Headers'];
    Body: CreateUserRequest['Body'];
    Reply: CreateUserResponse;
  }>(
    '/',
    {
      preHandler: verifyUser,
      schema: schemas.post
    },
    async (request, reply) => {
      const { email, name, role } = request.body;

      return pipe(
        async () => await createUserInDB({ email, name, role, prisma: fastify.prisma }),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 600 } }, () => {
              return reply.code(400).send({ error: 'ユーザーが既に存在します' });
            })
            .with({ error: { errorCode: 800 } }, () => {
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