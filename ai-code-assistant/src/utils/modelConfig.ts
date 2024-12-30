import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
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
  },
  GOOGLE: {
    GEMINI_EXP: {
      name: 'gemini-exp-1206',
      provider: 'google' as const
    },
    GEMINI_2_0_FLASH_THINKING_EXP_1219: {
      name: 'gemini-2.0-flash-thinking-exp-1219',
      provider: 'google' as const
    }
  }
} as const;

export type ModelConfig = {
  name: string;
  provider: 'anthropic' | 'openai' | 'google';
};

type AnthropicModels =
  (typeof MODEL_NAMES.ANTHROPIC)[keyof typeof MODEL_NAMES.ANTHROPIC];
type OpenAIModels =
  (typeof MODEL_NAMES.OPENAI)[keyof typeof MODEL_NAMES.OPENAI];
type GoogleModels =
  (typeof MODEL_NAMES.GOOGLE)[keyof typeof MODEL_NAMES.GOOGLE];
export type ModelName = AnthropicModels | OpenAIModels | GoogleModels;

// anthropic
const createAnthropicModel = (
  anthropicApiKey: string,
  modelConfig: ModelConfig
): BaseChatModel => {
  return new ChatAnthropic({
    anthropicApiKey,
    modelName: modelConfig.name
  });
};

// openai
const createOpenAIModel = (
  openaiApiKey: string,
  modelConfig: ModelConfig
): BaseChatModel => {
  return new ChatOpenAI({
    openAIApiKey: openaiApiKey,
    modelName: modelConfig.name
  });
};

// google
const createGoogleModel = (
  googleApiKey: string,
  modelConfig: ModelConfig
): BaseChatModel => {
  return new ChatGoogleGenerativeAI({
    apiKey: googleApiKey,
    modelName: modelConfig.name
  });
};

// モデルを生成する
export const createModel = (
  anthropicApiKey: string,
  openaiApiKey: string,
  googleApiKey: string,
  modelConfig: ModelConfig
): BaseChatModel => {
  switch (modelConfig.provider) {
    case 'anthropic':
      return createAnthropicModel(anthropicApiKey, modelConfig);
    case 'openai':
      return createOpenAIModel(openaiApiKey, modelConfig);
    case 'google':
      return createGoogleModel(googleApiKey, modelConfig);
    default:
      throw new Error(`未対応のモデルです: ${modelConfig.name}`);
  }
};
