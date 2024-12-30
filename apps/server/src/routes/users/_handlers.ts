import type { FastifyInstance } from "fastify";
import { pipe } from "ramda";
import { match, P } from "ts-pattern";
import { schemas } from "./schema";
import { extractParamsForCreateUser } from "./extractParamsForCreateUser";
import { createUserInDB } from "./createUserInDB";
import { bypass, dbMiddleware, start, verifyUser } from "@/utils";

export default async function (fastify: FastifyInstance) {
  /* eslint-disable-next-line functional/no-expression-statements */
  fastify.post<{
    Headers: { authorization: string; "x-device-id": string };
    Body: { email: string; name: string; role?: string };
    Reply: any;
  }>(
    "/",
    {
      preHandler: verifyUser,
      schema: schemas["post"],
    },
    async (request, reply) => {
      const createUser = dbMiddleware(createUserInDB);

      return pipe(
        start(extractParamsForCreateUser(request)),
        bypass(createUser),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 600 | 601 } }, () => {
              return reply
                .code(400)
                .send({ error: "リクエストパラメータが不正です" });
            })
            .with({ error: { errorCode: 610 } }, () => {
              return reply
                .code(409)
                .send({ error: "既に同じメールアドレスが存在します" });
            })
            .with({ error: { errorCode: P.union(620, 800) } }, () => {
              return reply
                .code(500)
                .send({ error: "ユーザー作成中にエラーが発生しました" });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive(),
      )();
    },
  );
}
