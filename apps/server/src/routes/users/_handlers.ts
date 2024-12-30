import type { FastifyInstance } from "fastify";
import { pipe } from "ramda";
import { match } from "ts-pattern";
import { extractParamsForCreateUser } from "./extractParamsForCreateUser";
import { createUserInDB } from "./createUser";
import type { CreateUserRequest, CreateUserResponse } from "./schema";
import { schemas } from "./schema";
import { bypass, dbMiddleware, start } from "@/utils";

export default async function (fastify: FastifyInstance) {
  /* eslint-disable-next-line functional/no-expression-statements */
  fastify.post<{
    Body: CreateUserRequest["body"];
    Reply: CreateUserResponse;
  }>(
    "/",
    {
      schema: schemas.post,
    },
    async (request, reply) => {
      const createUser = dbMiddleware(createUserInDB);
      return pipe(
        start(extractParamsForCreateUser(request)),
        bypass(createUser),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 600 | 601 | 602 } }, ({ error }) => {
              return reply.code(400).send({ error: error.message });
            })
            .with({ error: { errorCode: 610 } }, () => {
              return reply.code(409).send({ error: "User already exists" });
            })
            .with({ error: { errorCode: 620 } }, () => {
              return reply.code(500).send({ error: "Internal Server Error" });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(201).send(data);
            })
            .exhaustive(),
      )();
    },
  );
}
