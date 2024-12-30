import { MODEL_NAMES, ModelName } from './modelConfig';

type TokenPrices = {
  input: number;
  output: number;
};

//
const MODEL_PRICES: Record<string, TokenPrices> = {
  [MODEL_NAMES.ANTHROPIC.CLAUDE_3_HAIKU.name]: {
    input: 0.8,
    output: 4.0
  },
  [MODEL_NAMES.ANTHROPIC.CLAUDE_3_SONNET.name]: {
    input: 3.0,
    output: 15.0
  },
  [MODEL_NAMES.OPENAI.GPT_4.name]: {
    input: 10.0,
    output: 30.0
  },
  [MODEL_NAMES.OPENAI.GPT_4_MINI.name]: {
    input: 10.0,
    output: 30.0
  }
};

const USD_TO_JPY_RATE = 150;

export const calculatePrice = (
  modelConfig: ModelName,
  responseMetadata: any // モデルによって異なるので仕方なくany 重要な処理ではないので
): void => {
  const prices = MODEL_PRICES[modelConfig.name];
  if (!prices) {
    console.log(`⚠️ モデル ${modelConfig.name} の価格情報がありません`);
    return;
  }
  try {
    const inputTokens = responseMetadata.usage.input_tokens;
    const outputTokens = responseMetadata.usage.output_tokens;

    const inputTokenPrice = (inputTokens / 1_000_000) * prices.input;
    const outputTokenPrice = (outputTokens / 1_000_000) * prices.output;
    const totalUsdPrice = inputTokenPrice + outputTokenPrice;
    const totalJpyPrice = totalUsdPrice * USD_TO_JPY_RATE;

    console.log('📊 トークン情報:');
    console.log(`  入力トークン: ${inputTokens.toLocaleString()}`);
    console.log(`  出力トークン: ${outputTokens.toLocaleString()}`);
    console.log('');
    console.log('💰 料金情報:');
    console.log(`  USD: $${totalUsdPrice.toFixed(4)}`);
    console.log(`  JPY: ¥${Math.round(totalJpyPrice).toLocaleString()}`);
    console.log('  詳細:');
    console.log(`    入力トークン料金: $${inputTokenPrice.toFixed(4)}`);
    console.log(`    出力トークン料金: $${outputTokenPrice.toFixed(4)}`);
  } catch (error) {
    console.error('⚠️ 料金計算エラー (googleは未対応):', error);
    return;
  }
};
