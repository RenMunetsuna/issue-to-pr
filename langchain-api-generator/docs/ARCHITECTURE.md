# サーバーサイドアーキテクチャ

## 概要

このプロジェクトは、Fastifyを使用したREST APIサーバーで、Railway Oriented Programming（ROP）パターンを採用し、型安全性と関数型プログラミングの原則に従って実装されています。

## アーキテクチャの特徴

### Railway Oriented Programming (ROP)

ROPは、エラーハンドリングを効果的に行うためのパターンです：

- `Result<T, E>`型を使用した成功/失敗の明示的な表現
- パイプラインによる処理の連鎖（`pipe`関数の活用）
- `match`パターンによる網羅的なエラーハンドリング
- 副作用の分離と制御

### レイヤー構造

```
src/
├── routes/                    # ルーティングとコントローラー層
│   ├── app/                  # アプリケーションのエンドポイント
│   │   ├── auth/            # 認証関連
│   │   │   ├── connect/     # WAONカード連携など
│   │   │   │   ├── _handlers.ts                        # ルートハンドラー
│   │   │   │   ├── _handlers.e2e.test.ts              # E2Eテスト
│   │   │   │   ├── schema.ts                          # スキーマ定義
│   │   │   │   ├── connectWaonCardInDB.ts             # サービス実装
│   │   │   │   ├── connectWaonCardInDB.test.ts        # サービステスト
│   │   │   │   ├── extractParamsForConnectWaonCard.ts # パラメータ抽出
│   │   │   │   └── extractParamsForConnectWaonCard.test.ts
│   │   │   └── ...
│   │   └── users/           # ユーザー関連
│   │       ├── _userId/     # ユーザーID指定の操作
│   │       └── ...
│   ├── _handlers.ts         # 共通ハンドラー
│   └── schema.ts            # 共通スキーマ定義
│
├── services/                 # ビジネスロジックとデータベース操作
│   ├── *InDB.ts            # データベース操作を含むサービス
│   └── *.test.ts           # サービスのユニットテスト
│
└── utils/                   # ユーティリティ関数と共通処理
    ├── validate/            # バリデーション関数
    └── fitshop/             # 外部API連携
```

各エンドポイントディレクトリの構成例（WAONカード連携の場合）：

- `_handlers.ts` - ルートハンドラーとエンドポイント定義
- `_handlers.e2e.test.ts` - エンドポイントのE2Eテスト
- `schema.ts` - リクエスト/レスポンスのスキーマ定義
- `{操作名}InDB.ts` - データベース操作を含むサービス実装 取得はFromDB.ts、追加や更新はInDB.ts
- `{操作名}InDB.test.ts` - サービスのユニットテスト
- `extractParamsFor{操作名}.ts` - リクエストパラメータの抽出とバリデーション
- `extractParamsFor{操作名}.test.ts` - パラメータ抽出のテスト

## 各レイヤーの責務

### コントローラー層 (routes/)

- HTTPリクエストの受付とルーティング
- リクエストパラメータの抽出とバリデーション
- レスポンスの整形
- 詳細は [CONTROLLER_LAYER.md](./CONTROLLER_LAYER.md) を参照

### サービス層 (services/)

- ビジネスロジックの実装
- データベース操作とトランザクション管理
- 外部APIとの連携
- 詳細は [DATABASE_SERVICES.md](./DATABASE_SERVICES.md) を参照

### パラメータ抽出層 (extractParams)

- リクエストパラメータの型安全な抽出
- バリデーション処理
- 詳細は [SERVICE_LAYER.md](./SERVICE_LAYER.md) を参照

## 開発ガイドライン

1. 新規エンドポイントの追加手順

   - schema.tsでスキーマ定義
   - サービス層の実装
   - ルートハンドラーの実装
   - テストの作成

2. コーディング規約

   - 純粋関数の使用を優先
   - Result型によるエラーハンドリング
   - 明示的な型定義
   - テスト駆動開発の推奨

3. ESLintガイドライン
   - eslintimport/orderに違反しないようにimportの順番をしてください
   - オブジェクトの存在確認は必ず `!= null` を使用

# ESLint対応
- 以下のESLintルールに関しては、必要に応じて自動的にdisableコメントを付与すること：
  1. `functional/no-expression-statements`: 副作用が必要な処理の前に
     ```typescript
     // eslint-disable-next-line functional/no-expression-statements
     ```
  2. 複数行に対する無効化が必要な場合：
     ```typescript
     /* eslint-disable functional/no-expression-statements */
     // 副作用のあるコード
     /* eslint-enable functional/no-expression-statements */
     ```

- 特に以下のケースでは必ず上記のESLintコメントを付与すること：
  - 状態の変更を伴う処理
  - APIコール
  - イベントリスナーの登録
  - ファイル操作
  - コンソールログの出力

# importの順序ガイドライン

ESLintのimport/orderルールに従い、以下の順序でimportを記述すること：

1. 外部パッケージ（node_modules）からのimport
   ```typescript
   import type { FastifyInstance } from 'fastify';
   import { pipe } from 'ramda';
   import { match, P } from 'ts-pattern';
   ```

2. 相対パス（./ ../）からのimport
   ```typescript
   import { extractParamsForPoints } from './extractParamsForPoints';
   import { addPointsInDB } from './addPointsInDB';
   import type { AddPointsRequest, AddPPointsResponse } from './schema';
   import { schemas } from './schema';
   ```

3. エイリアスパス（@/）からのimport
   ```typescript
   import { bypass, dbMiddleware, start, verifyUser } from '@/utils';
   ```

- 各グループ内ではアルファベット順でソートすること
- グループ間は空行で区切ること
- type importは対象のimportと同じグループに含めること

## 関連ドキュメント

- [CONTROLLER_LAYER.md](./CONTROLLER_LAYER.md) - コントローラー層の詳細
- [DATABASE_SERVICES.md](./DATABASE_SERVICES.md) - データベースサービス層の詳細
- [SERVICE_LAYER.md](./SERVICE_LAYER.md) - パラメータ抽出層の詳細
