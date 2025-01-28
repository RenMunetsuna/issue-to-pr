import type { FastifyInstance } from "fastify";
import { pipe } from "ramda";
import { match, P } from "ts-pattern";
import { extractParamsForCreateProfile } from "./extractParamsForCreateProfile";
import { createProfileInDB } from "./createProfileInDB";
import type { CreateProfileRequest, CreateProfileResponse } from "./schema";
import { schemas } from "./schema";
import { bypass, dbMiddleware, start, verifyUser } from "@/utils";

export default async function (fastify: FastifyInstance) {
  /* eslint-disable-next-line functional/no-expression-statements */
  fastify.post<{
    Headers: CreateProfileRequest["Headers"];
    Params: CreateProfileRequest["Params"];
    Body: CreateProfileRequest["Body"];
    Reply: CreateProfileResponse;
  }>(
    "/:userId/profile",
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
            .with({ error: { errorCode: 400 } }, ({ error }) => {
              return reply.code(400).send({ error: error.message });
            })
            .with({ error: { errorCode: 500 } }, ({ error }) => {
              return reply.code(500).send({ error: error.message });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive(),
      )();
    },
  );
}
