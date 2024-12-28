import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { Octokit } from '@octokit/rest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * API生成を担当するメインクラス
 * LangChainとGitHub APIを使用してAPIコードを生成しPRを作成する
 */
class ApiGenerator {
  constructor(anthropicApiKey, githubToken, workspaceRoot) {
    // Claude 3 Sonnetモデルの初期化
    this.model = new ChatAnthropic({
      anthropicApiKey,
      modelName: 'claude-3-sonnet-20240229'
    });
    // GitHub APIクライアントの初期化
    this.octokit = new Octokit({ auth: githubToken });
    this.workspaceRoot = workspaceRoot;

    // ワークスペースの構造を確認
    console.log('\nWorkspace structure:');
    this.printDirectoryStructure(this.workspaceRoot);
  }

  printDirectoryStructure(dir, level = 0) {
    const files = readdirSync(dir);

    files.forEach((file) => {
      if (file === 'node_modules' || file === '.git') return;

      const path = join(dir, file);
      const stats = statSync(path);
      const prefix = '  '.repeat(level);

      if (stats.isDirectory()) {
        console.log(`${prefix}📁 ${file}/`);
        this.printDirectoryStructure(path, level + 1);
      } else {
        console.log(`${prefix}📄 ${file}`);
      }
    });
  }

  /**
   * ドキュメントファイルを読み込む
   * @param {string} filename - 読み込むファイル名
   * @returns {string} ファイルの内容
   */
  readDocFile(filename) {
    try {
      const filePath = join(this.workspaceRoot, 'docs', filename);
      console.log(`Attempting to read file: ${filePath}`);
      console.log('Current directory:', process.cwd());
      console.log('Workspace root:', this.workspaceRoot);
      console.log(
        'Directory contents of docs/:',
        readdirSync(join(this.workspaceRoot, 'docs'))
      );
      return readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.warn(
        `Warning: Could not read ${filename}. Error:`,
        error.message
      );
      console.log('Error stack:', error.stack);
      return '';
    }
  }

  /**
   * APIコードを生成する
   * @param {object} issue - Issue情報
   * @returns {Promise<object>} 生成されたコード
   */
  async generateApiCode(issue) {
    try {
      console.log('Reading project documentation...');
      const architectureDoc = this.readDocFile('ARCHITECTURE.md');
      const schemaDoc = this.readDocFile('SCHEMA.md');
      const controllerDoc = this.readDocFile('CONTROLLER.md');
      const databaseDoc = this.readDocFile('DATABASE_SERVICES.md');
      const testingDoc = this.readDocFile('TESTING.md');

      if (!issue || typeof issue !== 'object') {
        throw new Error('Invalid issue object');
      }

      console.log('Validating issue content...');
      const { title, content } = issue;
      if (!title || !content) {
        throw new Error(`Invalid issue format. Required fields are missing:
          title: ${title ? 'present' : 'missing'}
          content: ${content ? 'present' : 'missing'}`);
      }

      const issueInfo = {
        title,
        endpoint:
          content.match(/エンドポイント[^\n]*\n+([^\n]+)/)?.[1]?.trim() ||
          'Not specified',
        method:
          content.match(/メソッド[^\n]*\n+([^\n]+)/)?.[1]?.trim() ||
          'Not specified'
      };
      console.log('Parsed issue info:', issueInfo);

      // プロンプトテンプレートの設定
      const prompt = new PromptTemplate({
        template: `あなたはTypeScriptのエキスパートエンジニアです。
以下のプロジェクトのアーキテクチャとガイドラインに従って、APIエンドポイントを実装してください。

# プロジェクトアーキテクチャ
{architecture}

# スキーマガイドライン
{schema}

# コントローラーガイドライン
{controller}

# データベースサービスガイドライン
{database}

# テストガイドライン
{testing}

# Issue情報
タイトル: {title}
内容:
{content}

以下の要件に従ってください：
1. コードは TypeScript で記述してください
2. エラーハンドリングを適切に実装してください
3. テストコードは Jest を使用してください
4. コードはクリーンアーキテクチャの原則に従ってください
5. 必要なインポート文をすべて含めてください
6. ESLintのルールに従ってください
7. パフォーマンスを考慮したPrismaクエリを実装してください
8. 適切なエラーコードとステータスコードを使用してください

以下のファイルを生成してください。各ファイルは ### ファイル名 ### で区切って出力してください。
出力例：

### _handlers.ts ###
import type { FastifyPluginAsync } from 'fastify';
import { pipe } from 'ramda';
import { match } from 'ts-pattern';
import { extractParamsForGetUser } from './extractParamsForGetUser';
import { getUserFromDB } from './getUserFromDB';
import type { GetUserRequest, GetUserResponse } from './schema';
import { schemas } from './schema';

export const userHandler: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: GetUserRequest['params'];
    Reply: GetUserResponse;
  }>('/:userId', {
    schema: schemas.get,
    handler: async (request, reply) => {
      const result = await pipe(
        request,
        extractParamsForGetUser,
        async (params) =>
          params.success
            ? await getUserFromDB({ ...params.data, prisma: fastify.prisma })
            : params
      )();

      return match(result)
        .with({ success: true }, ({ data }) => reply.code(200).send(data))
        .with({ error: { errorCode: 400 } }, () =>
          reply.code(400).send({ error: 'リクエストが不正です' })
        )
        .with({ error: { errorCode: 404 } }, () =>
          reply.code(404).send({ error: 'ユーザーが見つかりません' })
        )
        .exhaustive();
    }
  });
};

### schema.ts ###
import { UserStatus } from '@prisma/client';
import type { JSONSchema } from 'json-schema-to-ts';
import type { GenerateRequestTypes, GenerateResponseTypes } from '@/types';

export const schemas = {
  get: {
    tags: ['user'],
    description: 'ユーザー情報取得',
    params: {
      type: 'object',
      properties: {
        userId: { type: 'string' }
      },
      required: ['userId']
    } as const satisfies JSONSchema,
    response: {
      200: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          name: { type: 'string' },
          status: {
            type: 'string',
            enum: Object.values(UserStatus)
          }
        },
        required: ['userId', 'name', 'status']
      } as const satisfies JSONSchema
    }
  }
};

export type GetUserRequest = GenerateRequestTypes<typeof schemas.get>;
export type GetUserResponse = GenerateResponseTypes<typeof schemas.get.response>;

### extractParamsForGetUser.ts ###
import type { FastifyRequest } from 'fastify';
import type { Result } from '@/types';
import type { GetUserRequest } from './schema';

export const extractParamsForGetUser = (
  request: FastifyRequest<GetUserRequest>
): Result<{ userId: string }> => {
  const { userId } = request.params;
  
  if (!userId.match(/^[a-z0-9]+$/)) {
    return {
      success: false,
      error: { errorCode: 400 }
    };
  }

  return {
    success: true,
    data: { userId }
  };
};

### getUserFromDB.ts ###
import type { PrismaClient } from '@prisma/client';
import type { Result } from '@/types';
import type { GetUserResponse } from './schema';

interface GetUserParams {
  userId: string;
  prisma: PrismaClient;
}

export const getUserFromDB = async ({
  userId,
  prisma
}: GetUserParams): Promise<Result<GetUserResponse[200]>> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      status: true
    }
  });

  if (!user) {
    return {
      success: false,
      error: { errorCode: 404 }
    };
  }

  return {
    success: true,
    data: {
      userId: user.id,
      name: user.name,
      status: user.status
    }
  };
};

生成するファイル：
1. _handlers.ts - メインのコントローラーファイル
2. schema.ts - リクエスト/レスポンスのスキーマ定義
3. extractParamsFor{操作名}.ts - パラメータ抽出とバリデーション
4. {操作名}FromDB.ts or {操作名}InDB.ts - データベース操作を含むサービス実装

各ファイルの内容は、プロジェクトのアーキテクチャとガイドラインに厳密に従ってください。`,
        inputVariables: [
          'architecture',
          'schema',
          'controller',
          'database',
          'testing',
          'title',
          'content'
        ]
      });

      const formattedPrompt = await prompt.format({
        architecture: architectureDoc,
        schema: schemaDoc,
        controller: controllerDoc,
        database: databaseDoc,
        testing: testingDoc,
        title: issue.title,
        content: issue.content
      });

      const response = await this.model.invoke([
        {
          role: 'system',
          content:
            'TypeScriptのエキスパートエンジニアとして、クリーンで保守性の高いコードを生成してください。'
        },
        {
          role: 'user',
          content: formattedPrompt
        }
      ]);

      console.log('Code generation completed');
      const files = this.parseGeneratedCode(response.content);
      console.log('Generated files:', Object.keys(files));

      return files;
    } catch (error) {
      console.error('Error in generateApiCode:', error);
      throw error;
    }
  }

  parseGeneratedCode(content) {
    console.log('Parsing generated code...');
    const sections = content.split('###').filter(Boolean);
    const files = {};

    sections.forEach((section) => {
      const titleMatch = section.match(/^\s*([\w/.]+\.ts)\s*$/m);
      if (titleMatch) {
        const fileName = titleMatch[1];
        const content = section.replace(/^\s*([\w/.]+\.ts)\s*$/m, '').trim();
        files[fileName] = content;
        console.log(`Parsed file: ${fileName} (${content.length} bytes)`);
      }
    });

    return files;
  }

  /**
   * 生成されたコードをPRとして作成
   * @param {string} owner - リポジトリオーナー
   * @param {string} repo - リポジトリ名
   * @param {number} issueNumber - Issue番号
   * @param {object} generatedFiles - 生成されたファイル群
   */
  async createPullRequest(owner, repo, issueNumber, generatedFiles) {
    try {
      console.log('Creating branch...');
      const branchName = `api-generate-${issueNumber}`;
      const defaultBranch = 'main';

      // Get the SHA of the default branch
      console.log('Getting default branch SHA...');
      const { data: defaultBranchData } = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch: defaultBranch
      });
      const baseSha = defaultBranchData.commit.sha;
      console.log('Default branch SHA:', baseSha);

      // Create a new branch
      console.log(`Creating branch: ${branchName}`);
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      });

      // Create commits for each file
      console.log('Creating commits...');
      for (const [path, content] of Object.entries(generatedFiles)) {
        console.log(`Creating commit for file: ${path}`);
        await this.octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message: `feat: Add ${path}`,
          content: Buffer.from(content).toString('base64'),
          branch: branchName
        });
      }

      // Create pull request
      console.log('Creating pull request...');
      const { data: pr } = await this.octokit.pulls.create({
        owner,
        repo,
        title: `API Generation #${issueNumber}`,
        body: `Closes #${issueNumber}`,
        head: branchName,
        base: defaultBranch
      });

      console.log('Pull request created:', pr.html_url);
      return pr;
    } catch (error) {
      console.error('Error in createPullRequest:', error);
      throw error;
    }
  }
}

// GitHub Actions から呼び出されるメイン関数
export async function main() {
  try {
    console.log('Starting main function...');

    const {
      ANTHROPIC_API_KEY,
      GITHUB_TOKEN,
      ISSUE_NUMBER,
      REPO_OWNER,
      REPO_NAME,
      ISSUE_CONTENT
    } = process.env;

    console.log('Validating environment variables...');
    const missingVars = [];
    if (!ANTHROPIC_API_KEY) missingVars.push('ANTHROPIC_API_KEY');
    if (!GITHUB_TOKEN) missingVars.push('GITHUB_TOKEN');
    if (!ISSUE_NUMBER) missingVars.push('ISSUE_NUMBER');
    if (!REPO_OWNER) missingVars.push('REPO_OWNER');
    if (!REPO_NAME) missingVars.push('REPO_NAME');
    if (!ISSUE_CONTENT) missingVars.push('ISSUE_CONTENT');

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }

    console.log('Parsing issue content...');
    let issue;
    try {
      console.log('Raw ISSUE_CONTENT:', ISSUE_CONTENT);
      // ISSUECONTENTが二重にJSON文字列化されている可能性があるため、必要に応じて2回パースする
      let parsedContent;
      try {
        // 最初のパース
        parsedContent = JSON.parse(ISSUE_CONTENT);
        // 文字列として渡された場合は2回目のパースを試みる
        if (typeof parsedContent === 'string') {
          console.log('Content is still a string, attempting second parse');
          parsedContent = JSON.parse(parsedContent);
        }
      } catch (parseError) {
        throw new Error(`JSON parse error: ${parseError.message}`);
      }

      issue = parsedContent;
      console.log('Parsed issue:', JSON.stringify(issue, null, 2));

      // イシューの内容を検証
      if (!issue || typeof issue !== 'object') {
        throw new Error('Invalid issue format: not an object');
      }

      if (!issue.title || typeof issue.title !== 'string') {
        throw new Error('Invalid issue format: missing or invalid title');
      }

      if (!issue.content || typeof issue.content !== 'string') {
        throw new Error('Invalid issue format: missing or invalid content');
      }

      // イシューの内容をログ出力
      console.log('Issue validation passed:', {
        title: issue.title,
        contentLength: issue.content.length,
        hasMethod: issue.content.includes('メソッド'),
        hasEndpoint: issue.content.includes('エンドポイント')
      });
    } catch (error) {
      console.error('Parse error details:', {
        error: error.message,
        content: ISSUE_CONTENT,
        typeof_content: typeof ISSUE_CONTENT
      });
      throw new Error(
        `Failed to parse or validate ISSUE_CONTENT: ${error.message}\nContent: ${ISSUE_CONTENT}`
      );
    }

    console.log('Initializing API generator...');
    const generator = new ApiGenerator(
      ANTHROPIC_API_KEY,
      GITHUB_TOKEN,
      process.cwd()
    );
    console.log('ApiGenerator initialized');

    console.log('Generating API code...');
    const generatedFiles = await generator.generateApiCode(issue);
    if (!generatedFiles || Object.keys(generatedFiles).length === 0) {
      throw new Error('No files were generated');
    }
    console.log('Generated files:', Object.keys(generatedFiles));

    console.log('Creating pull request...');
    await generator.createPullRequest(
      REPO_OWNER,
      REPO_NAME,
      ISSUE_NUMBER,
      generatedFiles
    );
    console.log('Pull request created successfully');
  } catch (error) {
    console.error('Error in main function:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
