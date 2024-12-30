import type { FastifyPluginAsync } from "fastify";
import { pipe } from "ramda";
import { match, P } from "ts-pattern";
import { verifyUser, dbMiddleware, start, bypass } from "@/utils";
import { extractParamsForCreateProfile } from "./extractParamsForCreateProfile";
import { createProfileInDB } from "./createProfileInDB";
import type { CreateProfileRequest, CreateProfileResponse } from "./schema";
import { schemas } from "./schema";

const profileHandler: FastifyPluginAsync = async (fastify) => {
  /* eslint-disable-next-line functional/no-expression-statements */
  fastify.post<{
    Headers: CreateProfileRequest["Headers"];
    Params: CreateProfileRequest["Params"];
    Body: CreateProfileRequest["Body"];
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
            .with({ error: { errorCode: 600 } }, () => {
              return reply
                .code(404)
                .send({ error: "ユーザーが見つかりません" });
            })
            .with({ error: { errorCode: P.union(610, 800) } }, () => {
              return reply.code(500).send({ error: "Internal Server Error" });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive(),
      )();
    },
  );
};

export default profileHandler;
