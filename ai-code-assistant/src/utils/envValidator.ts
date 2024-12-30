/**
 * 環境変数を検証する
 */
export function validateEnvVars<T extends string>(
  requiredVars: T[]
): Record<T, string> {
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0)
    throw new Error(
      `必須の環境変数が設定されていません: ${missingVars.join(', ')}`
    );

  return requiredVars.reduce((acc, varName) => {
    acc[varName] = process.env[varName]!;
    return acc;
  }, {} as Record<T, string>);
}
