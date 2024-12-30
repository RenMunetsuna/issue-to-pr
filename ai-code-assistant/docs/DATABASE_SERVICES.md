# データベースサービス層

## 概要

データベース操作を伴うサービス層の実装パターンと設計指針について説明します。
主に Prisma を使用したトランザクション処理と外部 API との連携に焦点を当てています。
各処理には簡単なコメントを残します

## 基本実装パターン

### 必要な import

```typescript
import type { Prisma } from '@/lib';
import type { Result } from '@/types';
import type { スキーマのレスポンス型 } from './schema';
```

### サービス関数の基本構造

```typescript
import { NewsStatus } from '@prisma/client';
import type { GetNewsDetailResponse } from './schema';
import type { Prisma } from '@/lib';
import type { Result } from '@/types';

/**
 * お知らせ詳細を取得
 */
export const getNewsDetailInDB = async ({
  userId,
  newsId,
  prisma
}: {
  userId: string;
  newsId: string;
  prisma: Prisma;
}): Promise<
  Result<GetNewsDetailResponse[200], { errorCode: 600 | 610 | 620 }>
> => {
  try {
    // お知らせを取得
    const news = await prisma.rNews.findUnique({
      relationLoadStrategy: 'join',
      where: { id: newsId },
      select: {
        id: true,
        title: true,
        segmentId: true,
        currentStatus: true,
        newsSelectedLinkTarget: {
          select: {
            linkTarget: true,
            url: true
          }
        },
        distributeStartNews: {
          select: {
            createdAt: true
          }
        },
        // セグメント情報を同時に取得
        newsSegment: {
          where: {
            userId
          },
          select: {
            userId: true
          }
        }
      }
    });
    if (news == null) return { success: false, error: { errorCode: 600 } };

    // 配信開始状態でない場合はエラー
    if (news.currentStatus !== NewsStatus.DISTRIBUTE_START) {
      return { success: false, error: { errorCode: 610 } };
    }

    // セグメント配信の場合、ユーザーが対象かチェック
    if (news.segmentId != null) {
      const newsSegment = await prisma.rNewsSegment.findUnique({
        where: {
          userId_newsId: {
            userId,
            newsId
          }
        }
      });
      if (newsSegment == null)
        return { success: false, error: { errorCode: 620 } };
    }

    return {
      success: true,
      data: {
        id: news.id,
        title: news.title,
        linkTarget: news.newsSelectedLinkTarget?.linkTarget ?? 'NEWS_DETAIL',
        url: news.newsSelectedLinkTarget?.url ?? null,
        createdAt: news.distributeStartNews?.createdAt.getTime() ?? 0
      }
    };
  } catch (error) {
    return { success: false, error: { errorCode: 600 } };
  }
};
```

## トランザクション処理

### 基本パターン

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. データベース操作
  const dbResult = await tx.table.operation({...});

  // 2. 外部APIリクエスト
  const apiResponse = await externalApi.request();
  if (!apiResponse.success) throw new CustomError(800);

  // 3. 追加のデータベース操作
  const additionalResult = await tx.table.operation({...});

  return { dbResult, apiResponse, additionalResult };
});
```

## エラーコード体系

### エラーコードの範囲

- 800 番台: 外部サービス（FITSHOP API 等）のエラー
- 600 番台: 各サービスファイルで独自に定義（10 刻みで増加）

### エラーコード例

```typescript
// connectWaonCardInDB.ts
type ErrorCode =
  | 600 // 生年月日不一致
  | 610 // デバイスIDなし
  | 620 // Prismaエラー
  | 630 // WAONカード番号重複
  | 800; // FITSHOP APIエラー

// addPointsInDB.ts
type ErrorCode =
  | 600 // ユーザー不在
  | 610 // QRコード不正
  | 620 // 本日既にポイント取得済み
  | 630 // Prismaエラー
  | 800; // FITSHOP APIエラー
```

## 設計原則

1. データ検証

   - 処理開始前に必要なデータの存在確認
   - 存在確認の際にレコードは nullable オブジェクトなので (record != null) というチェックを行う
   - 重複チェックなどの事前バリデーション

2. トランザクション設計

   - 必要最小限の操作のみをトランザクション内に含める
   - 長時間のトランザクションを避ける

3. エラーハンドリング

   - 具体的なエラーコードの使用
   - エラーの種類に応じた適切な処理

4. 外部 API 連携

   - リトライ処理の実装
   - タイムアウト設定
   - エラーレスポンスの適切な変換

5. コメント

   - 処理について簡単なコメントを記載

6. prisma のクエリ
   - リレーションを使用する場合は relationLoadStrategy: 'join',を使用する
   - パフォーマンスを考慮して必要なデータのみ取得する
