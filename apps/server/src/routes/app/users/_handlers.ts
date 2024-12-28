import type { FastifyInstance } from 'fastify';
import { pipe } from 'ramda';
import { match, P } from 'ts-pattern';
import { extractParamsForCreateUser } from './extractParamsForCreateUser';
import { createUserInDB } from './createUserInDB';
import type { CreateUserRequest, CreateUserResponse } from './schema';
import { schemas } from './schema';
import { bypass, dbMiddleware, start, verifyUser } from '@/utils';

/**
 * ユーザー作成エンドポイントのハンドラ
 * @param fastify Fastifyインスタンス
 */
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
      const createUser = dbMiddleware(createUserInDB);
      return pipe(
        start(extractParamsForCreateUser(request)),
        bypass(createUser),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 400 } }, () => {
              return reply.code(400).send({ error: 'リクエスト値が不正です' });
            })
            .with({ error: { errorCode: 409 } }, () => {
              return reply
                .code(409)
                .send({ error: 'このメールアドレスは既に登録されています' });
            })
            .with({ error: { errorCode: 500 } }, () => {
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
```

上記のコードでは、以下の機能が実装されています:

1. `schema.ts`: リクエストとレスポンスのスキーマ定義。メールアドレスの重複エラー、バリデーションエラー、内部サーバーエラーのレスポンスが定義されています。

2. `createUserInDB.ts`: ユーザーの新規作成を行うデータベースサービス関数。メールアドレスの重複チェックを行い、ユーザーデータを作成します。エラーコードに応じ