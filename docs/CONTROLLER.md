# コントローラー層

## 概要

コントローラー層は、HTTP リクエストの受付、パラメータの抽出、サービス層の呼び出し、レスポンスの整形を担当します。

## 基本実装パターン

### 必要な import

#### import は

```typescript
import type { FastifyInstance } from 'fastify';
import { pipe } from 'ramda';
import { match, P } from 'ts-pattern';
import { extractParamsForPoints } from './extractParamsForPoints';
import { addPointsInDB } from './addPointsInDB';
import type { AddPointsRequest, AddPPointsResponse } from './schema';
import { schemas } from './schema';
import { bypass, dbMiddleware, start, verifyUser } from '@/utils';
```

### コントローラーの基本構造

#### 重要な要件

1. 使える型パラメータは[`Headers`, `Params`, `QueryString`]のみです。小文字では使えません。
2. **preHandler は必須です。必ず以下の設定を含めてください：**
   ```typescript
   preHandler: verifyUser;
   ```
   これは全てのエンドポイントで必須の設定です。省略は許可されません。

### 基本実装例

```typescript
export default async function (fastify: FastifyInstance) {
  /*
   * GET: /app/users/:userId/news/:newsId
   */
  /* eslint-disable-next-line functional/no-expression-statements */
  fastify.post<{
    Headers: AddPointsRequest['Headers'];
    Params: AddPointsRequest['Params'];
    Querystring: AddPointsRequest['Querystring'];
    Reply: AddPPointsResponse;
  }>(
    '/',
    {
      preHandler: verifyUser,
      schema: schemas['post']
    },
    async (request, reply) => {
      const addPoints = dbMiddleware(addPointsInDB);
      return pipe(
        start(extractParamsForPoints(request)),
        bypass(addPoints),
        async (result) =>
          match(await result)
            .with({ error: { errorCode: 400 } }, () => {
              return reply.code(400).send({ error: 'リクエスト値が不正です' });
            })
            .with({ error: { errorCode: P.union(600, 610) } }, () => {
              return reply.code(404).send({
                error: 'ユーザーまたは店舗またはトークンが存在しません'
              });
            })
            .with({ error: { errorCode: 620 } }, () => {
              return reply
                .code(409)
                .send({ error: '既に本日来店ポイントを受け取っています' });
            })
            .with({ error: { errorCode: P.union(630, 800) } }, () => {
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

## レイヤー構成

### 1. パラメータ抽出層

- リクエストからのパラメータ抽出（extractParamsForPoints）
- バリデーション
- 型安全性の確保

### 2. サービス呼び出し層

- Prisma インスタンスの注入（dbMiddleware）
- サービス関数の実行（addPointsInDB）
- トランザクション管理

### 3. レスポンス整形層

- エラーコードの HTTP ステータスコードへの変換
- レスポンス形式の統一
- パターンマッチングによるエラーハンドリング

## エラーハンドリング

### エラーコードと HTTP ステータスコードの対応

```typescript
match(await result)
  .with({ error: { errorCode: 400 } }, () => {
    // バリデーションエラー
    return reply.code(400).send({ error: 'リクエスト値が不正です' });
  })
  .with({ error: { errorCode: P.union(600, 610) } }, () => {
    // リソース未検出
    return reply.code(404).send({
      error: 'ユーザーまたは店舗またはトークンが存在しません'
    });
  })
  .with({ error: { errorCode: 620 } }, () => {
    // 重複エラー
    return reply
      .code(409)
      .send({ error: '既に本日来店ポイントを受け取っています' });
  })
  .with({ error: { errorCode: P.union(630, 800) } }, () => {
    // システムエラー
    return reply.code(500).send({ error: 'Internal Server Error' });
  })
  .with({ success: true }, ({ data }) => {
    // 成功
    return reply.code(200).send(data);
  })
  .exhaustive();
```

## 設計原則

1. リクエスト処理

   - 適切な HTTP メソッドの使用（GET/POST/PUT/DELETE）
   - クエリパラメータ、パスパラメータ、ボディの使い分け
   - 必要最小限のデータのみを受け取る

2. レスポンス設計

   - 一貫性のあるレスポンス形式
   - 適切な HTTP ステータスコードの使用
   - エラーメッセージの明確化

3. エラーハンドリング

   - パターンマッチングによる網羅的なエラー処理
   - エラーコードの適切な変換
   - デバッグ情報の適切な制御

4. パフォーマンス

   - 不要なデータベースアクセスの回避
   - レスポンスサイズの最適化
   - キャッシュの適切な使用

5. 型安全性
   - Fastify のジェネリクスによるリクエスト/レスポンスの型定義
   - パターンマッチングによる網羅性チェック
   - 明示的な型定義の使用
