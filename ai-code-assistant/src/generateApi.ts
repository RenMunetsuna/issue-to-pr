import { ChatAnthropic } from '@langchain/anthropic';
import { Octokit } from '@octokit/rest';
import { createApiGenerationPrompt } from './prompts';
import {
  fileLoader,
  formatGeneratedFiles,
  loadDocuments,
  parseGeneratedCode,
  validateEnvVars
} from './utils';
import { fetchIssueDetails, GitHubIssue, createPullRequest } from './github';

type RequiredIssueFields = Pick<GitHubIssue, 'title' | 'body' | 'number'>;

type generateApiCodeTypes = {
  anthropicApiKey: string;
  issue: RequiredIssueFields;
};

type GeneratedFiles = {
  [key: string]: string;
};

/**
 * APIコードを生成する
 */
const generateApiCode = async ({
  anthropicApiKey,
  issue
}: generateApiCodeTypes): Promise<GeneratedFiles> => {
  try {
    console.log('ドキュメントの読み込み中...');
    const docs = loadDocuments([
      'ARCHITECTURE.md',
      'SCHEMA.md',
      'CONTROLLER.md',
      'DATABASE_SERVICES.md'
    ]);

    console.log('Prismaスキーマを読み込み中...');
    const prismaSchema = fileLoader('apps/server/prisma/schema.prisma');

    const prompt = createApiGenerationPrompt();

    // プロンプトのパラメータを準備
    const promptParams = {
      architecture: docs['architecture'],
      schema: docs['schema'],
      controller: docs['controller'],
      database_services: docs['database_services'],
      prismaSchema,
      title: issue.title,
      content: issue.body
    };

    console.log('プロンプトを生成中...');
    const formattedPrompt = await prompt.format(promptParams);

    console.log('LLMにリクエストを送信中...');
    const model = new ChatAnthropic({
      anthropicApiKey,
      modelName: 'claude-3-5-haiku-20241022'
    });

    const response = await model.invoke(formattedPrompt);
    if (!response.content) throw new Error('LLMからの応答が空です');
    const content = response.content;
    if (typeof content !== 'string')
      throw new Error('LLMの応答が文字列ではありません');

    console.log('✅ LLMからの応答を受信');

    const files = parseGeneratedCode(content);
    console.log('生成されたファイル:', Object.keys(files).length, '個');

    // Prettierでファイルをフォーマット
    const formattedFiles = await formatGeneratedFiles(files);

    return formattedFiles;
  } catch (error) {
    console.error(
      '❌ エラーが発生しました:',
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};

// GitHub Actions から呼び出されるメイン関数
export const main = async (): Promise<void> => {
  try {
    console.log('🚀 処理を開始します');
    console.log('環境変数を検証中...');
    const env = validateEnvVars([
      'ANTHROPIC_API_KEY',
      'GITHUB_TOKEN',
      'ISSUE_NUMBER',
      'REPO_OWNER',
      'REPO_NAME'
    ]);

    const octokit = new Octokit({
      auth: env.GITHUB_TOKEN
    });

    console.log('GitHubイシューを取得中...');
    const issue = await fetchIssueDetails(
      octokit,
      env.REPO_OWNER,
      env.REPO_NAME,
      Number(env.ISSUE_NUMBER),
      ['title', 'body', 'number']
    );

    if (!issue.title || !issue.body || !issue.number)
      throw new Error('イシューの必須フィールドが不足しています');

    // コード生成処理
    const generatedFiles = await generateApiCode({
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      issue: {
        title: issue.title,
        body: issue.body,
        number: issue.number
      }
    });

    console.log('プルリクエストを作成中...');
    await createPullRequest({
      octokit,
      owner: env.REPO_OWNER,
      repo: env.REPO_NAME,
      issueNumber: Number(env.ISSUE_NUMBER),
      files: Object.entries(generatedFiles).map(([fileName, content]) => ({
        path: fileName,
        content
      }))
    });

    console.log('✅ 処理が完了しました');
  } catch (error) {
    console.error(
      '❌ エラーが発生しました:',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(
    '予期せぬエラーが発生しました:',
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
