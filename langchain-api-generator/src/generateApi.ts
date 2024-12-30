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
  const logContext = {
    issueTitle: issue.title?.substring(0, 50),
    issueNumber: issue.number
  };

  try {
    console.log('📚 ドキュメントの読み込みを開始...', logContext);
    const docs = loadDocuments([
      'ARCHITECTURE.md',
      'SCHEMA.md',
      'CONTROLLER.md',
      'DATABASE_SERVICES.md'
    ]);

    console.log('🔍 Prismaスキーマを読み込み中...', logContext);
    let prismaSchema: string;
    try {
      prismaSchema = fileLoader('apps/server/prisma/schema.prisma');
      console.log('✅ Prismaスキーマの読み込み成功:', {
        ...logContext,
        schemaLength: prismaSchema.length,
        firstLine: prismaSchema.split('\n')[0]
      });
    } catch (error) {
      console.error('❌ Prismaスキーマの読み込みに失敗:', {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      prismaSchema = '';
    }

    console.log('🔧 プロンプトの生成を開始...', logContext);
    const prompt = createApiGenerationPrompt();

    const docsInfo = {
      architecture: docs['architecture']?.length ?? 0,
      schema: docs['schema']?.length ?? 0,
      controller: docs['controller']?.length ?? 0,
      database_services: docs['database_services']?.length ?? 0,
      prismaSchema: prismaSchema?.length ?? 0
    };

    console.log('📄 ドキュメントの読み込み状態:', {
      ...logContext,
      ...docsInfo
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

    // パラメータの検証
    const missingParams = Object.entries(promptParams)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingParams.length > 0) {
      throw new Error(
        `必須パラメータが不足しています: ${missingParams.join(', ')}`
      );
    }

    console.log('🤖 LLMにリクエストを送信中...', {
      ...logContext,
      promptLength: (await prompt.format(promptParams)).length
    });

    const model = new ChatAnthropic({
      anthropicApiKey,
      modelName: 'claude-3-5-sonnet-20241022'
    });

    const response = await model.invoke(await prompt.format(promptParams));
    if (!response.content) throw new Error('LLMからの応答が空です');
    const content = response.content;
    if (typeof content !== 'string')
      throw new Error('LLMの応答が文字列ではありません');

    console.log('✅ LLMからの応答を受信', {
      ...logContext,
      responseLength: content.length
    });

    const files = parseGeneratedCode(content);
    console.log('✨ 生成されたファイル:', {
      ...logContext,
      fileCount: Object.keys(files).length,
      files: Object.keys(files)
    });

    return files;
  } catch (error) {
    const errorDetails = {
      ...logContext,
      phase: 'APIコード生成',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    console.error('❌ エラーが発生しました:', errorDetails);
    throw error;
  }
};

// GitHub Actions から呼び出されるメイン関数
export const main = async (): Promise<void> => {
  const startTime = Date.now();
  const logContext = {
    startTime: new Date().toISOString()
  };

  try {
    console.log('🚀 処理を開始します', logContext);

    console.log('🔐 環境変数を検証中...');
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

    console.log('📥 GitHubイシューを取得中...', {
      ...logContext,
      issueNumber: env.ISSUE_NUMBER
    });

    const issue = await fetchIssueDetails(
      octokit,
      env.REPO_OWNER,
      env.REPO_NAME,
      Number(env.ISSUE_NUMBER),
      ['title', 'body', 'number']
    );

    if (!issue.title || !issue.body || !issue.number) {
      throw new Error('イシューの必須フィールドが不足しています');
    }

    console.log('🎯 コード生成を開始...', {
      ...logContext,
      issueTitle: issue.title.substring(0, 50),
      issueNumber: issue.number
    });

    const generatedFiles = await generateApiCode({
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      issue: {
        title: issue.title,
        body: issue.body,
        number: issue.number
      }
    });

    console.log('📤 プルリクエストを作成中...', {
      ...logContext,
      fileCount: Object.keys(generatedFiles).length
    });

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

    const executionTime = Date.now() - startTime;
    console.log('✅ 処理が完了しました', {
      ...logContext,
      executionTimeMs: executionTime,
      executionTimeFormatted: `${(executionTime / 1000).toFixed(2)}秒`
    });
  } catch (error) {
    const errorDetails = {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      executionTimeMs: Date.now() - startTime
    };
    console.error('❌ 処理が失敗しました:', errorDetails);
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
