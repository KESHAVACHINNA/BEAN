import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  dangerouslyAllowBrowser: true // Note: In production, use a backend to secure the API key
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  type?: 'text' | 'image' | 'file';
  metadata?: any;
}

export class OpenAIService {
  static async generateText(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Error generating text:', error);
      throw new Error('Failed to generate text response');
    }
  }

  static async summarizeText(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise, informative summaries. Provide a clear summary that captures the key points and main ideas.'
          },
          {
            role: 'user',
            content: `Please summarize the following text:\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || 'Unable to generate summary';
    } catch (error) {
      console.error('Error summarizing text:', error);
      throw new Error('Failed to summarize text');
    }
  }

  static async generateImage(prompt: string): Promise<string> {
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      });

      return response.data[0]?.url || '';
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image');
    }
  }

  static async analyzeImage(imageUrl: string, question?: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: question || 'Describe this image in detail. What do you see?'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || 'Unable to analyze image';
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image');
    }
  }
}