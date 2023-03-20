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
    this.logger.log('Sending a post to moderation...')

    await this.bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, post.content, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Publish',
              callback_data: {
                event: 'publish',
                id: post.id,
              },
            },
            {
              text: 'Schedule',
              callback_data: {
                event: 'schedule',
                id: post.id,
              },
            },
            {
              text: 'Skip',
              callback_data: {
                event: 'skip',
                id: post.id,
              },
            },
          ],
        ],
      }
    })
  }
}
