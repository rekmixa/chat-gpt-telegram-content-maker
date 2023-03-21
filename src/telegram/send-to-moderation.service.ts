import { Injectable, Logger } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { Post } from 'src/db/post.repository'

@Injectable()
export class SendToModerationService {
  private readonly logger: Logger = new Logger(SendToModerationService.name)
  private readonly bot: TelegramBot

  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
  }

  async send(post: Post): Promise<void> {
    const callbackData = event => {
      return JSON.stringify({
        event,
        id: post.id,
      })
    }

    await this.bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, post.content, {
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
