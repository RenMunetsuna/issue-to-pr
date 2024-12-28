import { ChatAnthropic } from '@langchain/anthropic';
import { createApiGenerationPrompt } from './prompt/apiGenerationPrompt.js';
import { PullRequestCreator } from './github/PullRequestCreator.js';
import { loadAllDocuments } from './utils/documentLoader.js';
import { printDirectoryStructure } from './utils/directoryPrinter.js';
import { parseGeneratedCode } from './utils/codeParser.js';

/**
 * API生成を担当するメインクラス
 * LangChainとGitHub APIを使用してAPIコードを生成しPRを作成する
 */
class ApiGenerator {
  constructor(anthropicApiKey, githubToken, workspaceRoot) {
    this.model = new ChatAnthropic({
      anthropicApiKey,
      modelName: 'claude-3-sonnet-20240229'
    });
    this.prCreator = new PullRequestCreator(githubToken);
    this.workspaceRoot = workspaceRoot;

    // ワークスペースの構造を確認
    printDirectoryStructure(this.workspaceRoot);
  }

  /**
   * APIコードを生成する
   * @param {object} issue - Issue情報
   * @returns {Promise<object>} 生成されたコード
   */
  async generateApiCode(issue) {
    try {
      if (!issue || typeof issue !== 'object') {
        throw new Error('Invalid issue object');
      }

      const { title, content } = issue;
      if (!title || !content) {
        throw new Error(`Invalid issue format. Required fields are missing:
          title: ${title ? 'present' : 'missing'}
          content: ${content ? 'present' : 'missing'}`);
      }

      // ドキュメントの読み込み
      const docs = loadAllDocuments([
        'ARCHITECTURE.md',
        'SCHEMA.md',
        'CONTROLLER.md',
        'DATABASE_SERVICES.md',
        'TESTING.md'
      ]);

      // プロンプトテンプレートの設定と実行
      const prompt = createApiGenerationPrompt();
      const formattedPrompt = await prompt.format({
        ...docs,
        title: issue.title,
        content: issue.content
      });

      const response = await this.model.invoke(formattedPrompt);
      const files = parseGeneratedCode(response.content);

      console.log('Generated files:', Object.keys(files));
      return files;
    } catch (error) {
      console.error('Error in generateApiCode:', error);
      throw error;
    }
  }
}

// GitHub Actions から呼び出されるメイン関数
export async function main() {
  try {
    const {
      ANTHROPIC_API_KEY,
      GITHUB_TOKEN,
      ISSUE_NUMBER,
      REPO_OWNER,
      REPO_NAME,
      ISSUE_CONTENT
    } = process.env;

    // 必須環境変数の確認
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

    // Issueの内容をパース
    let issue;
    try {
      let parsedContent;
      try {
        parsedContent = JSON.parse(ISSUE_CONTENT);
        if (typeof parsedContent === 'string') {
          parsedContent = JSON.parse(parsedContent);
        }
      } catch (parseError) {
        throw new Error(`JSON parse error: ${parseError.message}`);
      }

      issue = parsedContent;

      if (!issue || typeof issue !== 'object') {
        throw new Error('Invalid issue format: not an object');
      }

      if (!issue.title || typeof issue.title !== 'string') {
        throw new Error('Invalid issue format: missing or invalid title');
      }

      if (!issue.content || typeof issue.content !== 'string') {
        throw new Error('Invalid issue format: missing or invalid content');
      }
    } catch (error) {
      throw new Error(
        `Failed to parse or validate ISSUE_CONTENT: ${error.message}`
      );
    }

    // API生成の実行
    const generator = new ApiGenerator(
      ANTHROPIC_API_KEY,
      GITHUB_TOKEN,
      process.cwd()
    );

    const generatedFiles = await generator.generateApiCode(issue);
    if (!generatedFiles || Object.keys(generatedFiles).length === 0) {
      throw new Error('No files were generated');
    }

    // PRの作成
    await generator.prCreator.createPullRequest(
      REPO_OWNER,
      REPO_NAME,
      ISSUE_NUMBER,
      generatedFiles
    );
    console.log('Pull request created successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
});
