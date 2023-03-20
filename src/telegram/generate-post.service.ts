import { Inject, Injectable } from '@nestjs/common'
import { ChatCompletionRequestMessage } from 'openai/dist/api'
import { Post, PostRepository } from './../db/post.repository'
import { OpenAiService } from './open-ai.service'

@Injectable()
export class GeneratePostService {
  constructor(
    @Inject(OpenAiService) private readonly openaiService: OpenAiService,
    @Inject(PostRepository) private readonly postRepository: PostRepository
  ) { }

  async generatePost(): Promise<Post> {
    const requestMessages: ChatCompletionRequestMessage[] = [
      {
        role: 'system',
        content: 'Придумай рандомный анекдот',
      },
    ]

    const responseMessages = await this.openaiService.sendRequest(requestMessages)
    const firstMessage = responseMessages[0]

    if (firstMessage === undefined) {
      throw new Error('OpenAI Response is empty')
    }

    return this.postRepository.persist({ content: firstMessage.content })
  }
}
