# ユニットテスト ガイドライン

## 概要

ユニットテストは、個別の関数やユーティリティの動作を検証するためのテストです。
カバレッジは100%を条件にしています。
主に以下のような対象に対してテストを実施します：

- ユラメータ抽出関数（`extract*.test.ts`）
- ユーティリティ関数（`utils/*.test.ts`）
- バリデーション関数
- データ変換関数

## サンプルコード

### 1. パラメータ抽出のテスト

```typescript
import { FastifyRequest } from 'fastify';
import { extractParamsForGetUser } from './extractParamsForGetUser';
import { GetUserRequest } from './schema';

describe('extractParamsForGetUser', () => {
  // ユーザーのCUID
  const userCuid = 'clygt3jzi0009f2p0nrusvcc1';

  // CUID形式でない文字列
  const invalidCuid = '11';

  test('正常系', () => {
    const request = {
      params: { userId: userCuid }
    } as FastifyRequest<GetUserRequest>;

    const result = extractParamsForGetUser(request);
    expect(result).toEqual({
      success: true,
      data: { userId: userCuid }
    });
  });

  test('異常系 - CUID形式でない文字列', () => {
    const request = {
      params: { userId: invalidCuid }
    } as FastifyRequest<GetUserRequest>;

    const result = extractParamsForGetUser(request);
    expect(result).toEqual({
      success: false,
      error: { errorCode: 401 }
    });
  });
});
```

### 2. データベースサービスのテスト

```typescript
import { PrismaClient } from '@prisma/client';
import createPrismaMock from 'prisma-mock';
import { getNewsFromDB } from './getNewsFromDB';
import { seedCommonTestData } from '@/../prisma/seed';

describe('getNewsFromDB', () => {
  let testPrisma: PrismaClient;
  const userId = 'cm3qpgyxz0003dwkp0rgm4e5z';

  beforeAll(async () => {
    // テスト用のデータを作成
    testPrisma = createPrismaMock();
    await seedCommonTestData(testPrisma);
  });

  test('正常系 - お知らせ一覧取得', async () => {
    const result = await getNewsFromDB({
      userId,
      prisma: testPrisma
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.news).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            linkTarget: expect.stringMatching(
              /^(NEWS_DETAIL|COUPON_LIST|SURVEY_DETAIL|EXTERNAL_LINK)$/
            ),
            url: expect.any(String),
            distributedAt: expect.any(String)
          })
        ])
      );
      expect(result.data.news).toHaveLength(9); // シードデータの中で当てはまるものは9件
    }
  });
  test('異常系 - 存在しないユーザー (600)', async () => {
    const result = await getNewsFromDB({
      userId: 'invalid-user-id',
      prisma: testPrisma
    });

    expect(result).toEqual({
      success: false,
      error: { errorCode: 600 }
    });
  });

  test('異常系 - DBエラー (610)', async () => {
    jest
      .spyOn(testPrisma.rUser, 'findUnique')
      .mockRejectedValue(new Error('DB error'));

    const result = await getNewsFromDB({
      userId,
      prisma: testPrisma
    });

    expect(result).toEqual({
      success: false,
      error: { errorCode: 610 }
    });
  });
});
```

### 3. 日付変換関数のテスト

```typescript
// getJSTDateAndTime.test.ts
describe('getJSTDateAndTime', () => {
  test('正常系 - UTC -> JST 基本変換', () => {
    const date = new Date('2024-11-29T06:51:59.756Z');
    const result = getJSTDateAndTime(date);
    expect(result).toEqual({
      yyyymmdd: 20241129,
      hhmmss: 155159
    });
  });

  test('正常系 - 日付をまたぐ場合', () => {
    const date = new Date('2024-11-30T15:00:00Z');
    const result = getJSTDateAndTime(date);
    expect(result).toEqual({
      yyyymmdd: 20241201,
      hhmmss: 0
    });
  });

  test('正常系 - 閏年対応 2月29日', () => {
    const date = new Date('2024-02-29T23:59:59Z');
    const result = getJSTDateAndTime(date);
    expect(result).toEqual({
      yyyymmdd: 20240301,
      hhmmss: 85959
    });
  });
});
```

## テストケースの設計

1. 入力値の分類

   - 正常値（典型的なケース）
   - 境界値（最小値、最大値）
   - 異常値（無効な入力）
   - 特殊値（空文字列、不正な形式）

2. 出力の検証

   - 成功時のレスポンス形式
   - エラー時のレスポンス形式
   - エラーコードの検証

3. エッジケース
   - 空の入力
   - 不正な形式の入力
   - 境界値の入力

## テストの構造化

1. テストスイートの構成

   ```typescript
   describe('機能名', () => {
     // テストで使用する共通の変数
     const validInput = {
       /* ... */
     };
     const invalidInput = {
       /* ... */
     };

     test('正常系 - 説明', () => {
       // テスト内容
     });

     test('異常系 - 説明 (エラーコード)', () => {
       // テスト内容
     });
   });
   ```

2. テストケースの命名

   ```typescript
   test('正常系 - 全パラメータ正常');
   test('異常系 - 必須パラメータ欠落');
   test('異常系 - パラメータ形式不正');
   ```

## 関連ドキュメント

- [TESTING.md](./TESTING.md) - テスト戦略の概要
- [E2E_TESTING.md](./E2E_TESTING.md) - E2Eテストのガイドライン
