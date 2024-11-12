import { fetchWithCache } from '../cache';
import { getEnvString } from '../envars';
import type { ApiProvider, ProviderResponse } from '../types';
import { REQUEST_TIMEOUT_MS } from './shared';

const DIB_CHAT_URL = 'https://ai.api.dibdev.no/Test/chatCompletion';
const DIB_SOURCES_URL = 'https://ai.api.dibdev.no/Test/getCompletionSources';

interface DibCompletionOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string;
  promptId?: string;
}

export class DibProvider implements ApiProvider {
  modelName: string;
  config?: DibCompletionOptions;

  constructor(modelName: string, options: { config?: DibCompletionOptions; id?: string } = {}) {
    const { config, id } = options;
    this.modelName = modelName;
    this.config = config;
    this.id = id ? () => id : this.id;
  }

  id(): string {
    return `dib:${this.modelName}`;
  }

  toString(): string {
    return `[Dib Provider ${this.modelName}]`;
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    console.error('DIB Provider - Request:', {
      prompt,
      config: this.config,
      modelName: this.modelName,
    });

    const callUrl = this.modelName === 'chat' ? DIB_CHAT_URL : DIB_SOURCES_URL;

    const messages = [{ role: 'user', content: prompt }];

    const body = {
      model: 'gpt-4o',
      promptId: '3cc2c3a9-1330-4522-a563-f257538dbaac',
      messages,
      temperature: this.config?.temperature ?? 0.7,
      max_tokens: this.config?.max_tokens ?? 1500,
      top_p: this.config?.top_p ?? 0.95,
      frequency_penalty: this.config?.frequency_penalty ?? 0,
      presence_penalty: this.config?.presence_penalty ?? 0,
      stop: this.config?.stop ?? 'None',
      stream: false,
    };

    let response;
    try {
      response = await fetchWithCache(
        callUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            /* OPENAI_API_KEY: getEnvString('OPENAI_API_KEY'), */
            // @ts-expect-error
            'X-API-KEY': getEnvString('DIB_API_KEY'),
          },
          body: JSON.stringify(body),
        },
        REQUEST_TIMEOUT_MS,
        'text',
      );
    } catch (err) {
      console.error('DIB Provider - Error:', err);
      return {
        error: `API call error: ${String(err)}`,
      };
    }

    try {
      return {
        output: response,
      };
    } catch (err) {
      return {
        error: `API response error: ${String(err)}: ${JSON.stringify(response.data)}`,
      };
    }
  }
}
