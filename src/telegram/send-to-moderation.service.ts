import { Inject, Injectable, Logger } from '@nestjs/common'
import { Post } from 'src/db/post.repository'
import { PostRepository, PostStatus } from './../db/post.repository'
import { sendMessageToAdmin } from './telegram.module'

@Injectable()
export class SendToModerationService {
  private readonly logger: Logger = new Logger(SendToModerationService.name)

  constructor(
    @Inject(PostRepository) private readonly postRepository: PostRepository
  ) { }

  async send(post: Post): Promise<void> {
    if (post.status !== PostStatus.Moderating) {
      post.status = PostStatus.Moderating
      await this.postRepository.persist(post)
    }

    const callbackData = event => {
      return JSON.stringify({
        event,
        id: post.id,
      })
    }

    await sendMessageToAdmin(post.content, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Publish',
              callback_data: callbackData('publish'),
            },
            {
              text: 'Schedule',
              callback_data: callbackData('schedule'),
            },
            {
              text: 'Skip',
              callback_data: callbackData('skip'),
            },
          ],
        ],
      }
    })

    this.logger.log('Post was sent to moderation')
  }
}
