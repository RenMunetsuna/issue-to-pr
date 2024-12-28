# パラメーター抽出パターン

## 概要

パラメーター抽出は、HTTP リクエストからのデータ抽出とバリデーションを担当する重要な処理です。
リクエストパラメーターの型安全な抽出、バリデーション処理、Result 型を使用したエラーハンドリングを行います。

## バリデーション関数の使用

### バリデーション関数使用の指針

1. **スキーマに応じた使用**:

   - スキーマ定義から型が明確な場合、email や password などのバリデーションは`validateEmail`や`validatePassword`を使用してください
   - 例：Prisma スキーマで`@id @default(cuid())`が定義されているフィールドには`validateCuid`を使用
   - email や password などのバリデーションは`validateEmail`や`validatePassword`を使用してください

2. **利用可能なバリデーション関数**:

   - ID → `validateCuid` または `validateUuid`
   - メールアドレス → `validateEmail`
   - パスワード → `validatePassword`
   - 生年月日 → `validateBirthDate`
   - 英数字とハイフン → `validateAlphaNumHyphen`

3. **柔軟な対応**:

   ```typescript
   // スキーマからcuidであることが明確な場合
   return validateCuid(userId) && validateEmail(email)
     ? { success: true, data: { userId, email } }
     : { success: false, error: { errorCode: 400 } };

   // カスタムバリデーションが必要な場合
   return userId != null && email != null && customValidation(someField)
     ? { success: true, data: { userId, email, someField } }
     : { success: false, error: { errorCode: 400 } };
   ```

## バリデーション関数一覧

### 1. ID 検証

```typescript
validateCuid(id: string): boolean    // Prismaで使用されるcuid形式のID
validateUuid(id: string): boolean    // UUID v4形式のID
```

### 2. ユーザー情報検証

```typescript
validateEmail(email: string): boolean       // メールアドレス（@x-point-1.netドメインのみ許可）
validatePassword(pwd: string): boolean      // パスワード（大小文字・数字・記号を含む8文字以上）
validateBirthDate(date: string): boolean    // 生年月日（YYYYMMDD形式）
```

### 3. 汎用文字列検証

```typescript
validateAlphaNumHyphen(text: string): boolean  // 半角英数字とハイフンのみ
```

## 実装例

### 基本パターン

```typescript
export const extractParamsForGetUser = (
  request: FastifyRequest<GetUserRequest>
): Result<
  {
    userId: string;
    email: string;
  },
  {
    errorCode: 400;
  }
> => {
  const { userId } = request.params;
  const { email } = request.body;

  // スキーマからcuidとメールアドレスの形式が明確な場合
  return validateCuid(userId) && validateEmail(email)
    ? { success: true, data: { userId, email } }
    : { success: false, error: { errorCode: 400 } };
};
```

### 複合パターン

```typescript
export const extractParamsForCreateUser = (
  request: FastifyRequest<CreateUserRequest>
): Result<
  {
    email: string;
    customField: string;
    birthDate: string;
    deviceId: string;
  },
  {
    errorCode: 400;
  }
> => {
  const { email, customField, birthDate } = request.body;
  const deviceId = request.headers['x-device-id'];

  // 標準バリデーションと独自の検証を組み合わせる
  return validateEmail(email) &&
    customField != null &&
    validateBirthDate(birthDate) &&
    deviceId != null
    ? { success: true, data: { email, customField, birthDate, deviceId } }
    : { success: false, error: { errorCode: 400 } };
};
```

## レビューのポイント

1. **スキーマとの整合性**

   - スキーマ定義から型が明確な場合、適切なバリデーション関数を使用しているか
   - カスタムバリデーションが必要な場合、その理由が明確か

2. **型の一貫性**

   - リクエストの型定義と抽出するパラメータの型が一致しているか
   - バリデーション結果の型が Result 型に従っているか

3. **エラーハンドリング**
   - バリデーションエラーは適切なエラーコードで返却されているか
   - 複数のバリデーションを適切に組み合わせているか

## 注意点

- バリデーション関数は、スキーマから型が明確な場合に使用を推奨
- 独自のバリデーションが必要な場合は、その理由をコメントで明記
- 過度に厳密なバリデーションは避け、必要十分な検証を心がける

```

```
