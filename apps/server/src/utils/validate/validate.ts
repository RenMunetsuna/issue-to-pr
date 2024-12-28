// cuidのバリデーション
export const validateCuid = (cuid: string): boolean => {
  const cuidPattern = /^c[a-z0-9]{24}$/;
  return cuidPattern.test(cuid);
};

// uuidのバリデーション
export const validateUuid = (uuid: string): boolean => {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
};

// パスワードバリデーション
export const validatePassword = (password: string): boolean => {
  // cognitoのパスワードの設定に基づいたパターン
  // パスワードが特定のパターンに一致するかを確認（パスワードは大文字小文字、数字、特殊記号を1つ以上含めて8文字以上）
  const passwordPattern =
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)(?=.*?[!-/:-@[-`{-~])[!-~]{8,}$/;

  return passwordPattern.test(password);
};

// メールアドレスのバリデーション
export const validateEmail = (email: string): boolean => {
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
  return emailPattern.test(email);
};

// 半角英数字、ハイフンのバリデーション
export const validateAlphaNumHyphen = (input: string): boolean => {
  const alphaNumHyphenPattern = /^[a-z0-9-]+$/i;
  return alphaNumHyphenPattern.test(input);
};

// waonカード番号のバリデーション 690017から始まる16桁の数値
export const validateWaonCardNumber = (waonCardNumber: string): boolean => {
  const waonCardNumberPattern = /^690017[0-9]{10}$/;
  return waonCardNumberPattern.test(waonCardNumber);
};

// 生年月日のバリデーション YYYYMMDD形式
export const validateBirthDate = (birthDate: string): boolean => {
  // YYYYMMDD形式かチェック
  const datePattern = /^\d{4}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])$/;
  if (!datePattern.test(birthDate)) {
    return false;
  }

  // 日付として有効かチェック
  const year = parseInt(birthDate.slice(0, 4));
  const month = parseInt(birthDate.slice(4, 6));
  const day = parseInt(birthDate.slice(6, 8));

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// 郵便番号のバリデーション
export const validatePostalNo = (postalCode: string) => {
  const regex = /^\d{7}$/;
  return regex.test(postalCode);
};
