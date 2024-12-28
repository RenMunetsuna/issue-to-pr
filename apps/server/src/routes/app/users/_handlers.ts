import type { FastifyPluginAsync } from 'fastify';
import { pipe } from 'ramda';
import { match, P } from 'ts-pattern';
import { extractParamsForCreateUser } from './extractParamsForCreateUser';
import { createUserInDB } from './createUserInDB';
import type { CreateUserRequest, CreateUserResponse } from './schema';
import { schemas } from './schema';
import { bypass, dbMiddleware, start, verifyUser } from '@/utils';

const userHandler: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Headers: CreateUserRequest['Headers'];
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
              return reply.code(400).send({ error: 'リクエストパラメータが不正です' });
            })
            .with({ error: { errorCode: 600 } }, () => {
              return reply.code(409).send({ error: 'メールアドレスが既に使用されています' });
            })
            .with({ error: { errorCode: 610 } }, () => {
              return reply.code(422).send({ error: 'データベース操作に失敗しました' });
            })
            .with({ error: { errorCode: 800 } }, () => {
              return reply.code(500).send({ error: 'Internal Server Error', errorSubCode: 800 });
            })
            .with({ success: true }, ({ data }) => {
              return reply.code(200).send(data);
            })
            .exhaustive()
      )();
    }
  );
};

export default userHandler;
```

この実装では、以下のポイントに注意しています:

- スキーマ定義で適切な型とバリデーションを設定している
- パラメータの抽出と検証をするextraactParamsForCreateUser関数を作成している
- データベース操作をするcreateUserInDB関数を作成している
- エラーハンドリングを適切に行い、適切なエラーコードとHTTPステータスコードを返すようにしている
- コントローラー層でパイプライン処理を使ってクリーンな実装を行っている
- Prismaクエリでは必要最小限のデータのみを取得するようにしている