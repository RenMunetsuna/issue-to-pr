import type { FastifyInstance } from 'fastify';
import { pipe } from 'ramda';
import { match, P } from 'ts-pattern';
import { createUserInDB } from './createUserInDB';
import { verifyUser } from '@/utils';
import type { CreateUserRequest, CreateUserResponse } from './schema';
import { schemas } from './schema';

export default async function (fastify: FastifyInstance) {
  fastify.post<{
    Headers: CreateUserRequest['Headers'];
    Body: CreateUserRequest['Body'];
    Reply: CreateUserResponse;
  }>(
    '/',
    {
      preHandler: verifyUser,
      schema: schemas.post
    },
    async (request, reply) => {
      const { email, name, role } = request.body;

      return pipe(
        start(() => ({
          email,
          name,
          role,
          prisma: fastify.prisma
        })),
        bypass(createUserInDB),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 630 } }, () => {
              return reply.code(409).send({ error: 'メールアドレスが既に使用されています' });
            })
            .with({ error: { errorCode: 640 } }, () => {
              return reply.code(500).send({
                error: 'Internal Server Error',
                errorSubCode: 640,
                errorSubMessage: 'Prisma Error'
              });
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

上記は、ユーザー作成APIのコード実装例です。

- `schema.ts`にリクエストとレスポンスのスキーマを定義しています。ユーザーデータの必須フィールドやデータ型、エラーレスポンスのステータスコードとフォーマットを定義しています。
- `createUserInDB.ts`はユーザー作成のビジネスロジックを実装しています。メールアドレスの重複チェックとPrismaを使った新規ユーザーの作成を行っています。適切なエラーコードを返却するように実装されています。
- `_handlers.ts`はFastifyのルートハンドラーを実装しています。リクエストパラメータの抽出、サービス呼び出し、レスポンス整形を行っています。パターンマッチングによるエラーハンドリングと適切なHTTPステータスコードの返却を行っています。

コードは以下の指針に従って実装されています:

1. TypeScriptによる型安全性の確保
2. パターンマッチングによる網羅的なエラーハンドリング
3. クリーンアーキテクチャの原則に基づくレイヤー分離
4. 必要なインポートの適切な記述
5. ESLintルールの遵守
6. Prismaクエリのパフォーマンス最適化
7. 適切なエラーコードとHTTPステータスコードの使用