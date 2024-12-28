# API スキーマ設計

## 概要

API エンドポイントのスキーマ定義とその型生成について説明します。
Fastify のスキーマ定義を使用して、型安全な API エンドポイントを実装します。

## 基本実装パターン

### 必要な import

```typescript
import { UserStatus } from '@prisma/client';
import type { JSONSchema } from 'json-schema-to-ts';
import type { GenerateRequestTypes, GenerateResponseTypes } from '@/types';
```

### スキーマの基本構造

#### tags は user または admin のどちらか

#### **headers は必須です。必ず以下の設定を含めてください：**

```typescript
headers: {
  authorization: string;
  'x-device-id': string;
};
```

これは全てのエンドポイントで必須の設定です。省略は許可されません。

```typescript
export const schemas = {
  [method]: {
    tags: string[],                    // APIのカテゴリ
    description?: string,              // APIの説明（オプション）
    headers?: HeaderSchema,            // リクエストヘッダー
    params?: ParamsSchema,             // URLパラメータ
    querystring?: QuerySchema,         // クエリパラメータ
    body?: BodySchema,                 // リクエストボディ
    response: {                        // レスポンス定義
      [statusCode: number]: ResponseSchema
    }
  }
};
```

## レスポンスステータスコード

| ステータス | 説明                 | 使用例                          |
| ---------- | -------------------- | ------------------------------- |
| 200        | 成功                 | 正常なレスポンス                |
| 400        | リクエスト不正       | パラメータが不正な場合          |
| 404        | リソース未検出       | 対象が見つからない場合          |
| 409        | 競合エラー           | 既に処理済みの場合              |
| 422        | バリデーションエラー | 入力値が不正な場合              |
| 500        | サーバーエラー       | 内部エラーまたは外部 API エラー |

## 実装例

### ユーザー情報取得 API

```typescript
export const schemas = {
  get: {
    tags: ['user'],
    description: 'ユーザー情報取得',
    params: {
      type: 'object',
      properties: {
        userId: { type: 'string' }
      },
      required: ['userId']
    } as const satisfies JSONSchema,
    headers: {
      type: 'object',
      properties: {
        authorization: { type: 'string' },
        'x-device-id': { type: 'string' }
      }
    } as const satisfies JSONSchema,
    response: {
      200: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          name: { type: 'string' },
          createdAt: { type: 'number' },
          currentStatus: {
            type: 'string',
            enum: Object.values(UserStatus)
          }
        },
        required: ['userId', 'name', 'createdAt', 'currentStatus']
      } as const satisfies JSONSchema,
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        },
        required: ['error']
      } as const satisfies JSONSchema,
      500: {
        description: 'サーバーエラー',
        type: 'object',
        properties: {
          error: { type: 'string', enum: ['Internal Server Error'] },
          errorSubCode: { type: 'number' },
          errorSubMessage: { type: 'string', enum: ['FITSHOP API Error'] }
        },
        required: ['error']
      } as const satisfies JSONSchema
    }
  }
};

// 型の生成
export type GetResourceRequest = GenerateRequestTypes<typeof schemas.get>;
export type GetResourceResponse = GenerateResponseTypes<
  typeof schemas.get.response
>;
```

### 型生成の使用例

```typescript
export const resourceHandler: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: GetResourceRequest['params'];
    Reply: GetResourceResponse;
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    // 実装...
  });
};
```

## 設計原則

1. スキーマ定義

   - 必須フィールドの明示
   - 適切な型制約の設定
   - 列挙型による値の制限
   - headers はどの API エンドポイントでもテンプレート通りに設定

2. エラー設計

   - 統一的なエラーレスポンス形式
   - 適切なステータスコードの使用
   - エラーメッセージの一貫性

3. 型安全性

   - `as const satisfies JSONSchema`の使用
   - 列挙型による値の制限
   - Nullable な値の明示的な定義

4. コード構造
   - 基本エンドポイント: `schema.ts`
   - パラメータ付きエンドポイント: `_paramName/schema.ts`

```

```
