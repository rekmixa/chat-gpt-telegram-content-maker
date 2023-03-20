import { Injectable, Logger } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { ChatCompletionRequestMessage } from 'openai/dist/api'
import { OpenAiService } from './open-ai.service'

@Injectable()
export class TelegramService {
  private readonly logger: Logger = new Logger('TelegramService')
  private readonly bot: TelegramBot

  constructor(private readonly openaiService: OpenAiService) {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
  }

  async onModuleInit(): Promise<void> {
    this.bot.setMyCommands([
      {
        command: 'start',
        description: 'Start',
      },
      {
        command: 'ping',
        description: 'Ping',
      },
      {
        command: 'generate_post',
        description: 'Generate a post',
      },
    ])

    this.bot.on('callback_query', async data => {
      try {
        if (data.data === 'publish') {
          await this.publishInChannel(data.message.text)
        }

        await this.bot.editMessageReplyMarkup({}, {
          chat_id: data.message.chat.id,
          message_id: data.message.message_id,
        })
      } catch (error) {
        this.logger.error(error)
      }
    })

    this.bot.on('message', async message => {
      try {
        if (message.text === '/start') {
          this.bot.sendMessage(message.chat.id, `Your Chat ID: ${message.chat.id}`)
        }

        if (message.text === '/ping') {
          this.bot.sendMessage(message.chat.id, 'pong')
        }

        if (message.text === '/generate_post') {
          this.logger.log('Generating a post...')

          const requestMessages: ChatCompletionRequestMessage[] = [
            {
              role: 'system',
              content: 'Придумай рандомный анекдот',
            },
          ]

          const responseMessages = await this.openaiService.sendRequest(requestMessages)

          for (const message of responseMessages) {
            await this.sendToModeration(message.content)
          }
        }
      } catch (error) {
        this.logger.error(error)
      }
    })
  }

  private async sendToModeration(content: string): Promise<void> {
    this.logger.log('Sending a post to moderation...')

    await this.bot.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, content, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Publish',
              callback_data: 'publish',
            },
            {
              text: 'Skip',
              callback_data: 'skip',
            },
          ],
        ],
      }
    })
  }

  private async publishInChannel(content: string): Promise<void> {
    this.logger.log('Publishing a post...')

    await this.bot.sendMessage(process.env.TELEGRAM_CHANNEL_CHAT_ID, content)
  }
}
