import { Injectable, Logger } from '@nestjs/common'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources'

@Injectable()
export class OpenAiService {
  private readonly logger: Logger = new Logger(OpenAiService.name)
  private readonly openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL,
      organization: process.env.OPENAI_ORGANIZATION_ID,
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async sendRequest(
    messages: ChatCompletionMessageParam[],
  ): Promise<ChatCompletionMessageParam[]> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    })

    const resultMessages = completion.choices
      .filter(choice => choice.message !== undefined)
      .map(choice => choice.message)

    if (completion.usage !== undefined) {
      this.logger.log(
        Object.entries(completion.usage)
          .map(([key, value]) => `${key}=${value}`)
          .join(', ')
          .trim(),
      )
    }

    return resultMessages
  }
}
