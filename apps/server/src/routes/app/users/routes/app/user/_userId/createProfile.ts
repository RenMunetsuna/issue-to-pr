import type { FastifyInstance } from 'fastify';
import { pipe } from 'ramda';
import { match, P } from 'ts-pattern';
import { extractParamsForCreateProfile } from './extractParamsForCreateProfile';
import { createProfileInDB } from './createProfileInDB';
import type { CreateProfileRequest, CreateProfileResponse } from './schema';
import { schemas } from './schema';
import { bypass, dbMiddleware, start, verifyUser } from '@/utils';

export default async (fastify: FastifyInstance) => {
  fastify.post<{
    Headers: CreateProfileRequest['Headers'];
    Params: CreateProfileRequest['Params'];
    Body: CreateProfileRequest['Body'];
    Reply: CreateProfileResponse;
  }>(
    '/',
    {
      preHandler: verifyUser,
      schema: schemas.post
    },
    async (request, reply) => {
      const createProfile = dbMiddleware(createProfileInDB);
      return pipe(
        start(extractParamsForCreateProfile(request)),
        bypass(createProfile),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 400 } }, () => {
              return reply.code(400).send({ error: 'リクエスト値が不正です' });
            })
            .with({ error: { errorCode: 600 } }, () => {
              return reply.code(409).send({ error: 'プロフィールは既に作成済みです' });
            })
            .with({ error: { errorCode: 630 } }, () => {
              return reply.code(500).send({ error: 'Internal Server Error' });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive()
      )();
    }
  );
};