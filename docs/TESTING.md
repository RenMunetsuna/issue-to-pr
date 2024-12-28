# テスト戦略

## 概要

このプロジェクトでは、以下の3つのレベルでテストを実施しています：

1. E2Eテスト（エンドポイントテスト）

   - ファイル名: `_handlers.e2e.test.ts`
   - 目的: エンドポイントの統合テスト
   - 対象: リクエスト処理、レスポンス検証、DB状態確認、認証/認可

2. ユニットテスト

   - ファイル名: `*.test.ts`（`_handlers.test.ts`以外）
   - 目的: 個別機能のテスト
   - 対象: ユーティリティ関数、パラメータ抽出、バリデーション

## ディレクトリ構造

```
src/
├── routes/
│   └── app/
│       └── users/
│           ├── _handlers.ts              # エンドポイント実装
│           ├── _handlers.e2e.test.ts     # E2Eテスト
│           ├── extractParams.ts          # パラメータ抽出
│           ├── extractParams.test.ts     # パラメータ抽出テスト
│           ├── getFromDB.ts              # データベースサービス実装
│           └── getFromDB.test.ts         # データベースサービステスト
└── utils/
    ├── date/
    │   ├── index.ts                     # ユーティリティ実装
    │   └── getJSTDateAndTime.test.ts    # ユーティリティテスト
    └── validate/
        ├── index.ts                     # バリデーション実装
        └── validate.test.ts             # バリデーションテスト
```

## テストの実行

```bash
# 全てのテストを実行
npm run test

# 特定のテストファイルを実行
npm run test path/to/test.ts

# E2Eテストのみ実行
npm run test:e2e

# ユニットテストのみ実行
npm run test:unit
```

## ベストプラクティス

1. テストの独立性

   - 各テストは他のテストに依存しない
   - テストデータは各テストで初期化
   - テスト間で状態を共有しない

2. テストの可読性

   - 明確なテスト名（正常系/異常系を明示）
   - テストの意図が分かるコメント
   - Arrange-Act-Assert パターンの使用

3. テストカバレッジ

   - エンドポイントの全パターンをカバー
   - エラーケースの網羅
   - エッジケースの考慮

4. メンテナンス性
   - 共通のセットアップ処理
   - 再利用可能なヘルパー関数
   - モックの適切な使用

## テストコードの命名規則

1. テストファイル

   - E2Eテスト: `_handlers.e2e.test.ts`
   - ユニットテスト: `*.test.ts`
   - パラメータ抽出テスト: `extract*.test.ts`

2. テストケース
   ```typescript
   test('正常系 - ユーザー登録成功');
   test('異常系 - DBエラー (500)');
   test('異常系 - バリデーションエラー (400)');
   ```

## エラー処理とアサーション

1. ステータスコードの検証

   ```typescript
   expect(response.statusCode).toBe(200);
   expect(response.statusCode).toBe(400);
   ```

2. レスポンスボディの検証

   ```typescript
   expect(response.json()).toEqual({
     error: 'Internal Server Error'
   });
   ```

3. DBの状態検証
   ```typescript
   const device = await testPrisma.rDevice.findUnique({
     where: { deviceNumber: deviceId }
   });
   expect(device).toEqual({
     deviceNumber: deviceId,
     expoPushToken: expoPushToken
   });
   ```

## モックの使用

1. Firebaseのモック

   ```typescript
   jest.mock('firebase-admin/auth', () => ({
     getAuth: jest.fn(() => ({
       verifyIdToken: jest.fn((token: string) => {
         if (token !== accessToken) throw new Error('トークンが無効です');
       })
     }))
   }));
   ```

2. Prismaのモック
   ```typescript
   jest
     .spyOn(testPrisma.rDevice, 'upsert')
     .mockRejectedValue(new Error('DB is down'));
   ```

## 関連ドキュメント

- [UNIT_TESTING.md](./UNIT_TESTING.md) - ユニットテストのガイドライン
- [E2E_TESTING.md](./E2E_TESTING.md) - E2Eテストのガイドライン
