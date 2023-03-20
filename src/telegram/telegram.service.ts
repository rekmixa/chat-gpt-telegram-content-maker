import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { PostRepository } from 'src/db/post.repository'
import { GeneratePostService } from './generate-post.service'
import { PublishInChannelService } from './publish-in-channel.service'
import { SchedulePostService } from './schedule-post.service'
import { SendToModerationService } from './send-to-moderation.service'
import { SkipPostService } from './skip-post.service'

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger: Logger = new Logger(TelegramService.name)
  private readonly bot: TelegramBot
  private loading: boolean = false

  constructor(
    @Inject(GeneratePostService) private readonly generatePostService: GeneratePostService,
    @Inject(PublishInChannelService) private readonly publishInChannelService: PublishInChannelService,
    @Inject(SendToModerationService) private readonly sendToModerationService: SendToModerationService,
    @Inject(SchedulePostService) private readonly schedulePostService: SchedulePostService,
    @Inject(SkipPostService) private readonly skipPostService: SkipPostService,
    @Inject(PostRepository) private readonly postRepository: PostRepository,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
  }

  async onModuleInit(): Promise<void> {
    await this.bot.setMyCommands([
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
        const post = await this.postRepository.getById(data.data?.id)

        if (data.data?.event === 'publish') {
          await this.publishInChannelService.publish(post)
        }

        if (data.data?.event === 'schedule') {
          await this.schedulePostService.schedule(post)
        }

        if (data.data?.event === 'skip') {
          await this.skipPostService.skip(post)
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
      if (this.loading === true) {
        try {
          await this.bot.sendMessage(message.chat.id, 'Wait...')
        } catch (error) {
          this.logger.error(error)
        }

        return
      }

      try {
        this.loading = true
        await this.setTyping(message.chat.id)

        if (message.text === '/start') {
          await this.bot.sendMessage(message.chat.id, `Your Chat ID: ${message.chat.id}`)
        }

        if (message.text === '/ping') {
          await this.bot.sendMessage(message.chat.id, 'pong')
        }

        if (String(message.chat.id) !== String(process.env.TELEGRAM_ADMIN_CHAT_ID)) {
          this.logger.warn('Access denied')

          return
        }

        if (message.text === '/generate_post') {
          this.logger.log('Generating a post...')

          const post = await this.generatePostService.generatePost()
          await this.sendToModerationService.send(post)
        }
      } catch (error) {
        this.logger.error(error)
      } finally {
        this.loading = false
      }
    })
  }

  private async setTyping(chatId: string): Promise<void> {
    this.logger.log(`Typing started for: ${chatId}`)
    await this.bot.sendChatAction(chatId, 'typing')

    const interval = setInterval(async () => {
      if (this.loading === false) {
        this.logger.log(`Typing finished for: ${chatId}`)
        clearInterval(interval)

        return
      }

      this.logger.log(`Typing for: ${chatId}`)
      await this.bot.sendChatAction(chatId, 'typing')
    }, 1000)
  }
}
