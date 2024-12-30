import { PromptTemplate } from '@langchain/core/prompts';

export const createApiGenerationPrompt = () => {
  return new PromptTemplate({
    template: `あなたはTypeScriptのエキスパートエンジニアです。
以下のプロジェクトのアーキテクチャとガイドラインを確認してください

# プロジェクトアーキテクチャ
{architecture}

# スキーマガイドライン
{schema}

# コントローラーガイドライン
{controller}

# データベースサービスガイドライン
{database_services}

# Prismaスキーマ
{prismaSchema}

Prismaのスキーマを確認して、データベースのカラム名や型を確認してください
今回作成するファイルは全て同じディレクトリに配置してください

# Issue情報
タイトル: {title}
内容:
{content}

以下の要件に従ってください：
1. コードは TypeScript で記述してください
2. エラーハンドリングを適切に実装してください
3. コードはクリーンアーキテクチャの原則に従ってください
4. 必要なインポート文をすべて含めてください
5. ESLintのルールに従ってください
6. パフォーマンスを考慮したPrismaクエリを実装してください。
7. 適切なエラーコードとステータスコードを使用してください。
8. if文の処理が1行で終わる場合は、中括弧を省略してください。

# 重要な出力フォーマットの指示:
生成されるファイルは必ず以下の形式で出力してください：

1. 各ファイルは必ず以下の形式で開始してください：
### apps/server/src/routes/[エンドポイントパス]/[ファイル名].ts ###

2. その直後に必ずTypeScriptコードブロックを配置してください：
\`\`\`typescript
// ファイルの内容
\`\`\`

3. 各ファイルの間には空行を1行だけ入れてください

4. 以下は禁止されています：
- ファイル名の前後に説明文を入れること
- コードブロックの外にコメントを書くこと
- ファイル名に日本語を含めること
- \`\`\`typescriptと\`\`\`以外のマーカーを使用すること

5. 必ず作成するファイル：
- schema.ts: APIのスキーマ定義
- [処理名].ts: データベース操作の実装
- extractParamsFor[処理名].ts: パラメータ抽出処理

出力例：
### apps/server/src/routes/users/schema.ts ###
\`\`\`typescript
// スキーマの実装
\`\`\`

### apps/server/src/routes/users/createUser.ts ###
\`\`\`typescript
// データベース操作の実装
\`\`\`

この形式を厳密に守ってください。これ以外の形式は受け付けられません。`,
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
