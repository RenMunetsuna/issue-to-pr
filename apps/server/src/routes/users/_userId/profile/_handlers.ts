import type { FastifyInstance } from "fastify";
import { pipe } from "ramda";
import { match, P } from "ts-pattern";

import { createProfileInDB } from "./createProfileInDB";
import { extractParamsForCreateProfile } from "./extractParamsForCreateProfile";
import type { CreateProfileRequest, CreateProfileResponse } from "./schema";
import { schemas } from "./schema";
import { dbMiddleware, verifyUser } from "@/utils";

export default async function (fastify: FastifyInstance) {
  /*
   * POST: /app/users/:userId/profile
   */
  // eslint-disable-next-line functional/no-expression-statements
  fastify.post<{
    Headers: CreateProfileRequest["Headers"];
    Params: CreateProfileRequest["Params"];
    Body: CreateProfileRequest["Body"];
    Reply: CreateProfileResponse;
  }>(
    "/",
    {
      preHandler: verifyUser,
      schema: schemas["post"],
    },
    async (request, reply) => {
      const createProfile = dbMiddleware(createProfileInDB);
      return pipe(
        extractParamsForCreateProfile(request),
        ({ params, body }) =>
          params
            ? {
                ...body,
                userId: params.userId,
              }
            : undefined,
        createProfile,
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 600 } }, () => {
              return reply.code(404).send({ error: "ユーザーが存在しません" });
            })
            .with({ error: { errorCode: 610 } }, () => {
              return reply
                .code(409)
                .send({ error: "プロフィールが既に存在します" });
            })
            .with({ error: { errorCode: 620 } }, () => {
              return reply.code(500).send({ error: "Internal Server Error" });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .otherwise(() => {
              return reply.code(400).send({ error: "リクエスト値が不正です" });
            }),
      )();
    },
  );
}
