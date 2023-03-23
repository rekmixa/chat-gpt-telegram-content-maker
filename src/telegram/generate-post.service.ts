import { Inject, Injectable } from '@nestjs/common'
import { PromptRepository } from './../db/prompt.repository'
import { ChatCompletionRequestMessage } from 'openai/dist/api'
import { Post, PostRepository } from './../db/post.repository'
import { OpenAiService } from './open-ai.service'

@Injectable()
export class GeneratePostService {
  constructor(
    @Inject(OpenAiService) private readonly openaiService: OpenAiService,
    @Inject(PostRepository) private readonly postRepository: PostRepository,
    @Inject(PromptRepository) private readonly promptRepository: PromptRepository,
  ) { }

  async generatePost(): Promise<Post> {
    const prompts = await this.promptRepository.findAllActive()
    if (prompts.length === 0) {
      throw new Error('You have not added any prompts. Add at least one')
    }

    const requestMessages: ChatCompletionRequestMessage[] = prompts.map(prompt => ({
      role: 'system',
      content: prompt.text,
    }))

    const responseMessages = await this.openaiService.sendRequest(requestMessages)
    const firstMessage = responseMessages[0]

    if (firstMessage === undefined) {
      throw new Error('OpenAI Response is empty')
    }

    return this.postRepository.persist({ content: firstMessage.content })
  }
}
