import { Injectable, Logger } from '@nestjs/common'
import { Configuration, OpenAIApi } from 'openai'
import { ChatCompletionRequestMessage } from 'openai/dist/api'

@Injectable()
export class OpenAiService {
  private readonly logger: Logger = new Logger(OpenAiService.name)
  private readonly openai: OpenAIApi

  constructor() {
    this.openai = new OpenAIApi(new Configuration({
      organization: process.env.OPENAI_ORGANIZATION_ID,
      apiKey: process.env.OPENAI_API_KEY,
    }))
  }

  async sendRequest(messages: ChatCompletionRequestMessage[]): Promise<ChatCompletionRequestMessage[]> {
    const completion = await this.openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
    })

    const resultMessages = completion.data.choices
      .filter(choice => choice.message !== undefined)
      .map(choice => choice.message)

    if (completion.data.usage !== undefined) {
      this.logger.log(
        Object.entries(completion.data.usage)
          .map(([key, value]) => `${key}=${value}`)
          .join(', ')
          .trim()
      )
    }

    return resultMessages
  }
}
