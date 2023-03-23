import { Inject, Injectable, Logger } from '@nestjs/common'
import { PromptRepository } from './../db/prompt.repository'
import { ChatCompletionRequestMessage } from 'openai/dist/api'
import { Post, PostRepository } from './../db/post.repository'
import { OpenAiService } from './open-ai.service'

@Injectable()
export class GeneratePostService {
  private readonly logger: Logger = new Logger(GeneratePostService.name)

  constructor(
    @Inject(OpenAiService) private readonly openaiService: OpenAiService,
    @Inject(PostRepository) private readonly postRepository: PostRepository,
    @Inject(PromptRepository) private readonly promptRepository: PromptRepository,
  ) { }

  async generatePost(): Promise<Post> {
    const prompt = await this.promptRepository.findRandom()
    if (prompt === null) {
      throw new Error('Вы не добавили ни одного промпта. Добавьте хотя бы один')
    }

    this.logger.log(`Generating post using prompt: ${prompt.text}`)

    const promptTexts = this.promptRepository.splitTextToPrompts(prompt)
    const requestMessages: ChatCompletionRequestMessage[] = promptTexts.map(content => ({
      role: 'system',
      content,
    }))

    const responseMessages = await this.openaiService.sendRequest(requestMessages)
    const firstMessage = responseMessages[0]

    if (firstMessage === undefined) {
      throw new Error('OpenAI Response is empty')
    }

    return this.postRepository.persist({ content: firstMessage.content })
  }
}
