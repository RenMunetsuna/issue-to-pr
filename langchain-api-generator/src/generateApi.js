import { ChatAnthropic } from '@langchain/anthropic';
import { createApiGenerationPrompt } from './prompts/apiGenerationPrompt.js';
import { createPullRequest } from './github/PullRequestCreator.js';
import { loadAllDocuments } from './utils/documentLoader.js';
import { parseGeneratedCode } from './utils/codeParser.js';
import { validateEnvVars } from './utils/envValidator.js';
import { parseAndValidateIssue } from './utils/issueValidator.js';
import { fileLoader } from './utils/fileLoader.js';

/**
 * APIコードを生成する
 * @param {object} params - パラメータ
 * @param {string} params.anthropicApiKey - Anthropic APIキー
 * @param {object} params.issue - Issue情報
 * @returns {Promise<object>} 生成されたコード
 */
const generateApiCode = async ({ anthropicApiKey, issue }) => {
  try {
    // ドキュメントの読み込み
    const docs = loadAllDocuments([
      'ARCHITECTURE.md',
      'SCHEMA.md',
      'CONTROLLER.md',
      'DATABASE_SERVICES.md'
    ]);

    const prismaSchema = fileLoader('apps/server/prisma/schema.prisma');
    console.log(
      'Loaded prisma schema:',
      prismaSchema ? 'content exists' : 'content is null or empty'
    );
    console.log('prismaSchema type:', typeof prismaSchema);

    // プロンプトの作成
    const prompt = createApiGenerationPrompt();
    const formattedPrompt = await prompt.format({
      ...docs,
      prismaSchema,
      title: issue.title,
      content: issue.content
    });

    // モデルの初期化
    const model = new ChatAnthropic({
      anthropicApiKey,
      modelName: 'claude-3-5-sonnet-20241022'
    });

    // リクエストの送信
    const response = await model.invoke(formattedPrompt);

    // コードのパース
    const files = parseGeneratedCode(response.content);

    console.log('生成されたファイル:', Object.keys(files));
    return files;
  } catch (error) {
    console.error('APIコード生成中にエラーが発生しました:', error);
    throw error;
  }
};

// GitHub Actions から呼び出されるメイン関数
export const main = async () => {
  try {
    // 環境変数の検証
    const env = validateEnvVars([
      'ANTHROPIC_API_KEY',
      'GITHUB_TOKEN',
      'ISSUE_NUMBER',
      'REPO_OWNER',
      'REPO_NAME',
      'ISSUE_CONTENT'
    ]);

    // Issueの検証
    const issue = parseAndValidateIssue(env.ISSUE_CONTENT);

    // APIコードの生成
    const generatedFiles = await generateApiCode({
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      issue
    });
    if (!generatedFiles || Object.keys(generatedFiles).length === 0)
      throw new Error('ファイルが生成されませんでした');

    // プルリクエストの作成
    await createPullRequest({
      githubToken: env.GITHUB_TOKEN,
      owner: env.REPO_OWNER,
      repo: env.REPO_NAME,
      issueNumber: Number(env.ISSUE_NUMBER),
      files: generatedFiles
    });
    console.log('プルリクエストの作成が完了しました');
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('予期せぬエラーが発生しました:', error.message);
  process.exit(1);
});
