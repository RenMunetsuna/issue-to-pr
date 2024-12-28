import { PromptTemplate } from '@langchain/core/prompts';

export const createApiGenerationPrompt = () => {
  return new PromptTemplate({
    template: `あなたはTypeScriptのエキスパートエンジニアです。
以下のプロジェクトのアーキテクチャとガイドラインを確認してください

# プロジェクトアーキテクチャ
\${architecture}

# スキーマガイドライン
\${schema}

# コントローラーガイドライン
\${controller}

# データベースサービスガイドライン
\${database_services}

# Prismaスキーマ
\${prismaSchema}

Prismaのスキーマを確認して、データベースのカラム名や型を確認してください
今回作成するファイルは全て同じディレクトリに配置してください

# Issue情報
タイトル: \${title}
内容:
\${content}

以下の要件に従ってください：
1. コードは TypeScript で記述してください
2. エラーハンドリングを適切に実装してください
3. コードはクリーンアーキテクチャの原則に従ってください
4. 必要なインポート文をすべて含めてください
5. ESLintのルールに従ってください
6. パフォーマンスを考慮したPrismaクエリを実装してください
7. 適切なエラーコードとステータスコードを使用してください

出力フォーマット:
各ファイルは以下の形式で出力してください。コードの解説などは不要です：

### ファイル名.ts ###
\`\`\`typescript
// ファイルの内容
\`\`\`

注意事項：
- ファイル名とコードブロックの間に余分な空行や文字を入れないでください
- 各ファイルの区切りには必ず ### を使用してください
- コードブロックは必ず \`\`\`typescript で開始し、\`\`\` で終了してください
- 説明文やコメントは各ファイルのコードブロック内に記述してください
- ファイル名は拡張子(.ts)を含めて記述してください`,
    inputVariables: [
      'architecture',
      'schema',
      'controller',
      'database_services',
      'prismaSchema',
      'title',
      'content'
    ]
  });
};
