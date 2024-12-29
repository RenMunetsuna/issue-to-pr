/**
 * 生成されたコードをファイル単位でパースする
 * ### フルパス/ファイル名 ### ファイル内容 の形式でパースする
 */
export const parseGeneratedCode = (content: string): Record<string, string> => {
  const files: Record<string, string> = {};

  // ファイルブロックを抽出
  const fileBlocks = content.split(/(?=### apps\/server\/src\/routes\/)/);

  for (const block of fileBlocks) {
    // ファイルパスを抽出
    const pathMatch = block.match(
      /### (apps\/server\/src\/routes\/[^\s#]+\.ts) ###/
    );
    if (!pathMatch?.[1]) continue;

    const fileName = pathMatch[1];

    // コードブロックを抽出
    const codeBlockMatch = block.match(/```typescript\n([\s\S]*?)\n```/);
    if (!codeBlockMatch?.[1]) {
      console.warn(`不正なコードブロック形式をスキップ: ${fileName}`);
      continue;
    }

    const cleanContent = codeBlockMatch[1].trim();
    if (!cleanContent) {
      console.warn(`空のコードブロックをスキップ: ${fileName}`);
      continue;
    }

    // ファイル名のバリデーション
    if (
      !fileName.endsWith('.ts') ||
      fileName.includes('：') ||
      fileName.includes(':') ||
      /[^\x00-\x7F]/.test(fileName) // 非ASCII文字をチェック
    ) {
      console.warn(`不正なファイル名形式をスキップ: ${fileName}`);
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
