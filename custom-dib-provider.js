class DibApiProvider {
  constructor(options) {
    this.providerId = options.id || 'dibai:gpt-4';
    this.config = options.config;
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, context) {
    const messages = [{ role: 'user', content: prompt }];

    const body = {
      model: 'gpt-4o',
      promptId: this.config?.promptId || '',
      messages,
      stream: false,
      temperature: this.config?.temperature || 0.7,
      max_tokens: this.config?.max_tokens || 1500,
      top_p: this.config?.top_p || 0.95,
      frequency_penalty: this.config?.frequency_penalty || 0,
      presence_penalty: this.config?.presence_penalty || 0,
      stop: this.config?.stop || 'None',
    };

    try {
      const { fetchWithCache } = require('promptfoo').cache;
      
      const response = await fetchWithCache(
        'https://ai.dibdev.no/api/Chat/chatCompletion',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'X-API-KEY': process.env.DIB_API_KEY,
          },
          body: JSON.stringify(body),
        },
        10000, // 10 second timeout
      );

      return {
        output: response.data.choices[0].message.content,
        tokenUsage: {
          total: response.data.usage?.total_tokens || 0,
          prompt: response.data.usage?.prompt_tokens || 0,
          completion: response.data.usage?.completion_tokens || 0,
        }
      };
    } catch (err) {
      return {
        error: `API call error: ${String(err)}`,
      };
    }
  }
}

module.exports = DibApiProvider;
