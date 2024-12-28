# E2E テスト ガイドライン

## 概要

E2E テストは、エンドポイントの統合テストを行います。
実際の HTTP リクエストを模擬し、以下の要素を検証します：

- リクエストの処理
- レスポンスの検証
- データベースの状態確認
- 認証/認可の動作
- エラーハンドリング

## サンプルコード

### 1. 基本的な CRUD エンドポイントのテスト

```typescript
// _handlers.e2e.test.ts
import { PrismaClient } from '@prisma/client';
import fastify from 'fastify';
import { seedCommonTestData } from '@/../prisma/seed/seed';
import fastifyAutoLoad from '@/utils/railway/fastifyAutoLoad';

const accessToken = 'secure-token';

jest.mock('@/utils/validate/tokenValidation', () => ({
  verifyUser: jest.fn(() => Promise.resolve(true))
}));

/*
 * GET /app/users/:userId
 */
describe('/app/users/:userId', () => {
  const server = fastify();
  let testPrisma: PrismaClient;
  // 本会員ユーザー
  const regularUser = {
    id: 'cm3qpgyxz0003dwkp0rgm4e5z',
    deviceNumber: 'testDeviceNumber'
  };
  // 存在しないユーザーid
  const notFoundUserId = 'cm3qpgyxz9999dwkp0rgm4e5z';

  beforeAll(async () => {
    const { default: createPrismaMock } = await import('prisma-mock');
    // テスト用のデータを作成
    testPrisma = createPrismaMock();
    await seedCommonTestData(testPrisma);
    jest.mock('@/lib', () => {
      return {
        prisma: testPrisma
      };
    });
    await server.register(fastifyAutoLoad);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  /*
   * 正常系
   */
  test('GET: 正常系', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/app/users/${regularUser.id}`,
      headers: {
        authorization: accessToken,
        'x-device-id': regularUser.deviceNumber
      }
    });

    expect(response.statusCode).toBe(200);
  });

  /*
   * 異常系
   */
  test('GET: 異常系 - ユーザーが存在しない場合 (404)', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/app/users/${notFoundUserId}`,
      headers: {
        authorization: accessToken,
        'x-device-id': regularUser.deviceNumber
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'ユーザーが見つかりません'
    });
  });

  test('GET: 異常系 - DB down (500)', async () => {
    jest
      .spyOn(testPrisma.rUser, 'findUnique')
      .mockRejectedValue(new Error('DB is down'));

    const response = await server.inject({
      method: 'GET',
      url: `/app/users/${notFoundUserId}`,
      headers: {
        authorization: accessToken,
        'x-device-id': regularUser.deviceNumber
      }
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: 'Internal Server Error'
    });
  });
});
```

## テストケースの設計

1. リクエストパターン

   - 正常なリクエスト
   - 無効なパラメータ
   - 不正な認証情報
   - 不正なヘッダー
   - 大きなペイロード

2. レスポンス検証

   - ステータスコード
   - レスポンスボディ
   - エラーメッセージ
   - 認証エラー

3. データベース検証

   - データの作成
   - データの更新
   - データの削除
   - 関連データの整合性

4. エラーケース
   - バリデーションエラー
   - 認証エラー
   - 権限エラー
   - DB エラー
   - 外部 API エラー

## テストの構造化

1. テストケースの命名

   ```typescript
   test('正常系 - リクエスト成功');
   test('異常系 - 認証エラー');
   test('異常系 - DBエラー');
   ```

## モックの使用

1. tokenValidation のモック

   ```typescript
   jest.mock('@/utils/validate/tokenValidation', () => ({
     verifyUser: jest.fn(() => Promise.resolve(true))
   }));
   ```

2. Prisma のモック

```typescript
jest
  .spyOn(testPrisma.rDevice, 'upsert')
  .mockRejectedValue(new Error('DB is down'));
```

3. 外部 API のモック
   ```typescript
   jest.mock('@/utils/external-api', () => ({
     callExternalApi: jest.fn().mockResolvedValue({
       data: {
         /* モックレスポンス */
       }
     })
   }));
   ```

## 関連ドキュメント

- [TESTING.md](./TESTING.md) - テスト戦略の概要
- [UNIT_TESTING.md](./UNIT_TESTING.md) - ユニットテストのガイドライン
