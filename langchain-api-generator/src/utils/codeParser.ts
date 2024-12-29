/**
 * 生成されたコードをファイル単位でパースする
 * ### フルパス/ファイル名 ### ファイル内容 の形式でパースする
 */
export const parseGeneratedCode = (content: string): Record<string, string> => {
  const files: Record<string, string> = {};

  // セクションを分割して処理
  const sections = content
    .split(/###\s*([^#\n]+)\s*###/)
    .filter(Boolean)
    .map((section) => section.trim());

  // セクションを2つずつ処理（ファイル名とコンテンツのペア）
  for (let i = 0; i < sections.length - 1; i += 2) {
    const fileName = sections[i];
    const fileContent = sections[i + 1];

    if (!fileName || !fileContent) continue;

    // ファイル名のバリデーション
    if (
      !fileName.startsWith('apps/server/src/routes/') ||
      !fileName.endsWith('.ts') ||
      fileName.includes('：') ||
      fileName.includes(':') ||
      /[^\x00-\x7F]/.test(fileName) // 非ASCII文字をチェック
    ) {
      console.warn(`不正なファイル名形式をスキップ: ${fileName}`);
      continue;
    }

    // コードブロックのバリデーション
    const codeBlockMatch = fileContent.match(/^```typescript\n([\s\S]*)\n```$/);
    if (!codeBlockMatch?.[1]) {
      console.warn(`不正なコードブロック形式をスキップ: ${fileName}`);
      continue;
    }

    const cleanContent = codeBlockMatch[1].trim();
    if (!cleanContent) {
      console.warn(`空のコードブロックをスキップ: ${fileName}`);
      continue;
    }

    files[fileName] = cleanContent;
  }

  if (Object.keys(files).length === 0) {
    throw new Error('有効なファイルが生成されませんでした');
  }

  // 必須ファイルの存在チェック
  const requiredFiles = ['schema.ts'];
  const missingFiles = requiredFiles.filter(
    (file) => !Object.keys(files).some((path) => path.endsWith(`/${file}`))
  );

  if (missingFiles.length > 0) {
    throw new Error(`必須ファイルが不足しています: ${missingFiles.join(', ')}`);
  }

  return files;
};
