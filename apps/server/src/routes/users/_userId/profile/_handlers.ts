import type { FastifyInstance } from "fastify";
import { pipe } from "ramda";
import { match } from "ts-pattern";
import { extractParamsForCreateProfile } from "./extractParamsForCreateProfile";
import { createProfileInDB } from "./createProfileInDB";
import type { CreateProfileRequest, CreateProfileResponse } from "./schema";
import { schemas } from "./schema";
import { bypass, dbMiddleware, start, verifyUser } from "@/utils";

export default async function (fastify: FastifyInstance) {
  /* eslint-disable-next-line functional/no-expression-statements */
  fastify.post<{
    Headers: CreateProfileRequest["headers"];
    Params: CreateProfileRequest["params"];
    Body: CreateProfileRequest["body"];
    Reply: CreateProfileResponse;
  }>(
    "/",
    {
      preHandler: verifyUser,
      schema: schemas.post,
    },
    async (request, reply) => {
      const createProfile = dbMiddleware(createProfileInDB);

      return pipe(
        start(extractParamsForCreateProfile(request)),
        bypass(createProfile),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 400 } }, () => {
              return reply.code(400).send({ error: "リクエスト値が不正です" });
            })
            .with({ error: { errorCode: 600 } }, () => {
              return reply.code(404).send({ error: "ユーザーが存在しません" });
            })
            .with({ error: { errorCode: 610 } }, () => {
              return reply.code(500).send({ error: "Internal Server Error" });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive(),
      )();
    },
  );
}