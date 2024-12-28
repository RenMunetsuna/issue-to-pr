/**
 * 環境変数を検証する
 * @param {string[]} requiredVars - 必須の環境変数名の配列
 * @returns {object} 検証済みの環境変数
 */
export function validateEnvVars(requiredVars) {
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `必須の環境変数が設定されていません: ${missingVars.join(', ')}`
    );
  }

  return requiredVars.reduce((acc, varName) => {
    acc[varName] = process.env[varName];
    return acc;
  }, {});
}
