import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { Octokit } from '@octokit/rest';
import { readFileSync } from 'fs';
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
  }

  /**
   * ドキュメントファイルを読み込む
   * @param {string} filename - 読み込むファイル名
   * @returns {string} ファイルの内容
   */
  readDocFile(filename) {
    try {
      return readFileSync(join(this.workspaceRoot, 'docs', filename), 'utf-8');
    } catch (error) {
      console.warn(`Warning: Could not read ${filename}`);
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

      console.log('Generating code from issue:', {
        title: issue.title,
        endpoint: issue.content
          .match(/エンドポイント[^\n]*\n+([^\n]+)/)?.[1]
          ?.trim(),
        method: issue.content.match(/メソッド[^\n]*\n+([^\n]+)/)?.[1]?.trim()
      });

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

���成するファイル：
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

    console.log('Environment variables loaded');
    console.log('Issue number:', ISSUE_NUMBER);
    console.log('Repo owner:', REPO_OWNER);
    console.log('Repo name:', REPO_NAME);

    if (!ANTHROPIC_API_KEY || !GITHUB_TOKEN) {
      throw new Error('Required environment variables are missing');
    }

    const issue = JSON.parse(ISSUE_CONTENT);
    console.log('Parsed issue content:', JSON.stringify(issue, null, 2));

    const generator = new ApiGenerator(
      ANTHROPIC_API_KEY,
      GITHUB_TOKEN,
      process.cwd()
    );
    console.log('ApiGenerator initialized');

    console.log('Generating API code...');
    const generatedFiles = await generator.generateApiCode(issue);
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
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
