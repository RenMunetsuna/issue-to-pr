import type { FastifyInstance } from 'fastify';
import { pipe } from 'ramda';
import { match, P } from 'ts-pattern';
import { createUserInDB } from './createUserInDB';
import { schemas, CreateUserRequest, CreateUserResponse } from './schema';
import { verifyUser } from '@/utils';

export default async function (fastify: FastifyInstance) {
  fastify.post<{
    Headers: CreateUserRequest['headers'];
    Body: CreateUserRequest['body'];
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
        await createUserInDB({ email, name, role, prisma: request.prisma }),
        match()
          .with({ error: { errorCode: 400 } }, () => {
            return reply.code(400).send({ error: 'Invalid request body' });
          })
          .with({ error: { errorCode: 600 } }, () => {
            return reply.code(409).send({ error: 'Email already exists' });
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