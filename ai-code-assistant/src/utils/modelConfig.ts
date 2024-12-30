import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export const MODEL_NAMES = {
  ANTHROPIC: {
    CLAUDE_3_HAIKU: {
      name: 'claude-3-5-haiku-20241022',
      provider: 'anthropic' as const
    },
    CLAUDE_3_SONNET: {
      name: 'claude-3-5-sonnet-20241022',
      provider: 'anthropic' as const
    }
  },
  OPENAI: {
    GPT_4: {
      name: 'gpt-4o-2024-08-06',
      provider: 'openai' as const
    },
    GPT_4_MINI: {
      name: 'gpt-4o-mini-2024-07-18',
      provider: 'openai' as const
    }
  }
} as const;

export type ModelConfig = {
  name: string;
  provider: 'anthropic' | 'openai';
};

type AnthropicModels =
  (typeof MODEL_NAMES.ANTHROPIC)[keyof typeof MODEL_NAMES.ANTHROPIC];
type OpenAIModels =
  (typeof MODEL_NAMES.OPENAI)[keyof typeof MODEL_NAMES.OPENAI];
export type ModelName = AnthropicModels | OpenAIModels;

const createAnthropicModel = (
  anthropicApiKey: string,
  modelConfig: ModelConfig
): BaseChatModel => {
  return new ChatAnthropic({
    anthropicApiKey,
    modelName: modelConfig.name
  });
};

const createOpenAIModel = (
  openaiApiKey: string,
  modelConfig: ModelConfig
): BaseChatModel => {
  return new ChatOpenAI({
    openAIApiKey: openaiApiKey,
    modelName: modelConfig.name
  });
};

// モデルを生成する
export const createModel = (
  anthropicApiKey: string,
  openaiApiKey: string,
  modelConfig: ModelConfig
): BaseChatModel => {
  switch (modelConfig.provider) {
    case 'anthropic':
      return createAnthropicModel(anthropicApiKey, modelConfig);
    case 'openai':
      return createOpenAIModel(openaiApiKey, modelConfig);
    default:
      throw new Error(`未対応のモデルです: ${modelConfig.name}`);
  }
};
