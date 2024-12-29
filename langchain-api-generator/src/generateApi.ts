import { ChatAnthropic } from '@langchain/anthropic';
import { Octokit } from '@octokit/rest';
import { createApiGenerationPrompt } from './prompts/apiGenerationPrompt.js';
import { createPullRequest } from './github/pullRequest.js';
import { loadDocuments } from './utils/documentLoader.js';
import { parseGeneratedCode } from './utils/codeParser.js';
import { validateEnvVars } from './utils/envValidator.js';
import { fetchIssueDetails, GitHubIssue } from './github/issue.js';
import { fileLoader } from './utils/fileLoader.js';

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
    // ドキュメントの読み込み
    const docs = loadDocuments([
      'ARCHITECTURE.md',
      'SCHEMA.md',
      'CONTROLLER.md',
      'DATABASE_SERVICES.md'
    ]);

    // prisma schemaを読み込む
    const prismaSchema = fileLoader('apps/server/prisma/schema.prisma');

    // プロンプトの作成
    const prompt = createApiGenerationPrompt();
    console.log('ドキュメントの読み込み結果:', {
      architecture: docs['architecture']?.length ?? 0,
      schema: docs['schema']?.length ?? 0,
      controller: docs['controller']?.length ?? 0,
      database_services: docs['database_services']?.length ?? 0,
      prismaSchema: prismaSchema?.length ?? 0
    });

    console.log('Issue情報:', {
      title: issue.title?.length ?? 0,
      body: issue.body?.length ?? 0
    });

    // プロンプトのパラメータを準備
    const promptParams = {
      architecture: String(docs['architecture'] ?? ''),
      schema: String(docs['schema'] ?? ''),
      controller: String(docs['controller'] ?? ''),
      database_services: String(docs['database_services'] ?? ''),
      prismaSchema: String(prismaSchema ?? ''),
      title: String(issue.title ?? ''),
      content: String(issue.body ?? '')
    };

    // パラメータの存在確認
    Object.entries(promptParams).forEach(([key, value]) => {
      if (!value) {
        console.warn(`警告: プロンプトパラメータ "${key}" が空です`);
      }
    });

    const formattedPrompt = await prompt.format(promptParams);
    console.log('フォーマット済みプロンプト長:', formattedPrompt.length);

    // モデルの初期化
    const model = new ChatAnthropic({
      anthropicApiKey,
      modelName: 'claude-3-5-sonnet-20241022'
    });

    // リクエストの送信
    const response = await model.invoke(formattedPrompt);
    if (!response.content) throw new Error('レスポンスが空です');
    const content = response.content;
    if (typeof content !== 'string') throw new Error('Expected string content');

    console.log('LLMのレスポンス:', content);

    // 生成されたコードをファイル単位でパース
    const files = parseGeneratedCode(content);

    console.log('生成されたファイル:', Object.keys(files));

    return files;
  } catch (error) {
    console.error(
      'APIコード生成中にエラーが発生しました:',
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};

// GitHub Actions から呼び出されるメイン関数
export const main = async (): Promise<void> => {
  try {
    // 環境変数の検証
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

    // イシューを取得
    const issue = await fetchIssueDetails(
      octokit,
      env.REPO_OWNER,
      env.REPO_NAME,
      Number(env.ISSUE_NUMBER),
      ['title', 'body', 'number']
    );
    console.log('issueを取得');

    if (!issue.title || !issue.body || !issue.number)
      throw new Error('Required issue fields are missing');

    console.log('コード生成リクエスト中...');
    // コードを生成
    const generatedFiles = await generateApiCode({
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      issue: {
        title: issue.title,
        body: issue.body,
        number: issue.number
      }
    });
    console.log('コード生成完了');

    // プルリクエストを作成
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
    console.log('プルリクエストの作成完了');
  } catch (error) {
    console.error(
      'エラー:',
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
