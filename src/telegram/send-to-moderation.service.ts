import { Injectable, Logger } from '@nestjs/common'
import { Post } from 'src/db/post.repository'

import { PostStatus } from './../db/post.repository'
import { sendMessageToAdmin } from './telegram.module'

@Injectable()
export class SendToModerationService {
  private readonly logger: Logger = new Logger(SendToModerationService.name)

  async send(post: Post): Promise<void> {
    await sendMessageToAdmin(post.content, {
      reply_markup: this.getReplyMarkup(post),
    })

    this.logger.log('Post was sent to moderation')
  }

  getReplyMarkup(post: Post): any {
    const callbackData = event => {
      return JSON.stringify({
        event,
        id: post.id,
      })
    }

    return {
      inline_keyboard:
        post.status !== PostStatus.Moderating
          ? [
              [
                {
                  text: 'На модерацию',
                  callback_data: callbackData('moderate'),
                },
              ],
            ]
          : [
              [
                {
                  text: 'Опубликовать',
                  callback_data: callbackData('publish'),
                },
                {
                  text: 'В очередь',
                  callback_data: callbackData('schedule'),
                },
                {
                  text: 'Отклонить',
                  callback_data: callbackData('skip'),
                },
              ],
            ],
    }
  }
}
