import { FastifyPluginAsync } from 'fastify';
import { pipe } from 'ramda';
import { match, P } from 'ts-pattern';
import { verifyUser } from '@/utils';
import { createUserInDB } from './createUserInDB';
import type { CreateUserRequest, CreateUserResponse } from './schema';
import { schemas } from './schema';

const userHandler: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: CreateUserRequest['body'];
    Headers: CreateUserRequest['headers'];
    Reply: CreateUserResponse;
  }>(
    '/',
    {
      preHandler: verifyUser,
      schema: schemas.post
    },
    async (request, reply) => {
      const { email, name, role } = request.body;
      const prisma = request.prisma;

      return pipe(
        async () => await createUserInDB({ email, name, role }, prisma),
        async (result) =>
          match(result)
            .with({ error: { errorCode: 400 } }, () => {
              return reply.code(400).send({ error: 'リクエストが不正です' });
            })
            .with({ error: { errorCode: 600 } }, () => {
              return reply.code(409).send({ error: 'メールアドレスが duplicated です' });
            })
            .with({ error: { errorCode: 610 } }, () => {
              return reply.code(409).send({ error: 'メールアドレスの一意制約に violated です' });
            })
            .with({ error: { errorCode: 620 } }, () => {
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

export default userHandler;
```

ここでは、以下の処理を行っています：

1. `schema.ts`でリクエストとレスポンスのスキーマを定義しています。スキーマには、リクエストボディ、ヘッダー、およびレスポンスのプロパティが含まれています。

2. `createUserInDB.ts`では、ユーザー作成のビジネスロジックを実装しています。メールアドレスの重複チェックと、ユーザーの作成を行っています。エラーハンドリングも適切に行われています。

3. `_handlers.ts`では、HTTPエンドポイントのハンドラーを定義しています。ユーザー認証の前処理(`verifyUser`)とスキーマの検証を行った後、`createUserInDB`関数を呼び出しています。レスポンスはパターンマッチングによりエラーコードに応じて適切なHTTPステータスコードとエラーメッセージを返します。

このコードは、クリーンアーキテクチャの原則に従っており、エラーハンドリングが適切に実装されています。Prismaクエリも適切に使用されており、パフォーマンスも考慮されています。ESLintのルールにも従っており、必要なインポート文も含まれています。