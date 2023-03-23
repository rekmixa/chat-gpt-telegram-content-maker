import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { PostRepository, PostStatus } from 'src/db/post.repository'
import { PromptRepository } from 'src/db/prompt.repository'
import { GeneratePostService } from './generate-post.service'
import { PublishInChannelService } from './publish-in-channel.service'
import { SchedulePostService } from './schedule-post.service'
import { SendToModerationService } from './send-to-moderation.service'
import { SkipPostService } from './skip-post.service'
import { sendMessageToTelegram } from './telegram.module'

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger: Logger = new Logger(TelegramService.name)
  private readonly bot: TelegramBot
  private loading: boolean = false
  private editingPromptId?: number
  private isAddingPrompt: boolean = false

  constructor(
    @Inject(GeneratePostService) private readonly generatePostService: GeneratePostService,
    @Inject(PublishInChannelService) private readonly publishInChannelService: PublishInChannelService,
    @Inject(SendToModerationService) private readonly sendToModerationService: SendToModerationService,
    @Inject(SchedulePostService) private readonly schedulePostService: SchedulePostService,
    @Inject(SkipPostService) private readonly skipPostService: SkipPostService,
    @Inject(PostRepository) private readonly postRepository: PostRepository,
    @Inject(PromptRepository) private readonly promptRepository: PromptRepository,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
  }

  async onModuleInit(): Promise<void> {
    await this.initializeMenu()

    this.bot.on('callback_query', async data => {
      try {
        const payload = JSON.parse(data.data)
        if (payload.event === 'cancel_action') {
          this.isAddingPrompt = false
          this.editingPromptId = undefined
          await this.bot.editMessageReplyMarkup({}, {
            chat_id: data.message.chat.id,
            message_id: data.message.message_id,
          })

          return
        }

        if (['edit_prompt', 'remove_prompt'].includes(payload.event)) {
          const prompt = await this.promptRepository.getById(payload.id)
          if (payload.event === 'edit_prompt') {
            this.isAddingPrompt = false
            this.editingPromptId = prompt.id

            await sendMessageToTelegram(data.from.id, `Please, send a new content for prompt: ${prompt.text}`, this.getCancelActionRequest())
          }

          if (payload.event === 'remove_prompt') {
            this.isAddingPrompt = false
            await this.promptRepository.remove(prompt)
            await sendMessageToTelegram(data.from.id, 'prompt successfully deleted')
          }

          return
        }

        const post = await this.postRepository.getById(payload.id)

        let successMessage: string
        let replyMarkup = {
          inline_keyboard: [
            [
              {
                text: 'Moderate',
                callback_data: JSON.stringify({
                  event: 'moderate',
                  id: post.id,
                }),
              },
            ],
          ]
        }

        if (post.status === PostStatus.Published) {
          replyMarkup = undefined
          successMessage = 'post already published'
        } else if (payload.event === 'moderate') {
          post.status = PostStatus.Moderating
          await this.postRepository.persist(post)
          replyMarkup = this.sendToModerationService.getReplyMarkup(post)
        } else if (payload.event === 'publish') {
          await this.publishInChannelService.publish(post)
          replyMarkup = undefined
          successMessage = 'published'
        } else if (payload.event === 'schedule') {
          await this.schedulePostService.schedule(post)
          successMessage = 'scheduled'
        } else if (payload.event === 'skip') {
          await this.skipPostService.skip(post)
          successMessage = 'skipped'
        }

        await this.bot.editMessageReplyMarkup(replyMarkup, {
          chat_id: data.message.chat.id,
          message_id: data.message.message_id,
        })

        if (successMessage !== undefined) {
          await sendMessageToTelegram(data.from.id, successMessage)
        }
      } catch (error) {
        this.logger.error('Callback query error', error)
      }
    })

    this.bot.on('message', async message => {
      if (this.loading === true) {
        try {
          await sendMessageToTelegram(message.chat.id, 'Wait...')
        } catch (error) {
          this.logger.error('Wait message error', error)
        }

        return
      }

      try {
        this.loading = true
        await this.setTyping(message.chat.id)

        if (message.text === '/start') {
          await sendMessageToTelegram(message.chat.id, `Your Chat ID: ${message.chat.id}`)
        }

        if (message.text === '/ping') {
          await sendMessageToTelegram(message.chat.id, 'pong')
        }

        if (String(message.chat.id) !== String(process.env.TELEGRAM_ADMIN_CHAT_ID)) {
          this.logger.warn('Access denied')

          return
        }

        if (this.isAddingPrompt === true) {
          this.isAddingPrompt = false
          await this.promptRepository.persist({ text: message.text })
          await sendMessageToTelegram(message.chat.id, 'Prompt successfully added!')

          return
        }

        if (this.editingPromptId !== undefined) {
          const prompt = await this.promptRepository.getById(this.editingPromptId)
          prompt.text = message.text
          await this.promptRepository.persist(prompt)
          await sendMessageToTelegram(message.chat.id, 'prompt changed')

          return
        }

        if (message.text === '/prompts') {
          const prompts = await this.promptRepository.findAllActive()

          if (prompts.length === 0) {
            await sendMessageToTelegram(message.chat.id, 'No results found. Add first prompt!')
            return
          }

          for (const prompt of prompts) {
            await sendMessageToTelegram(message.chat.id, prompt.text, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🖋 Edit',
                      callback_data: JSON.stringify({
                        event: 'edit_prompt',
                        id: prompt.id,
                      })
                    },
                    {
                      text: '🗑 Remove',
                      callback_data: JSON.stringify({
                        event: 'remove_prompt',
                        id: prompt.id,
                      })
                    },
                  ],
                ],
              },
            })
          }
        }

        if (message.text === '/add_prompt') {
          this.isAddingPrompt = true
          await sendMessageToTelegram(message.chat.id, 'Send a content for new prompt in new message', this.getCancelActionRequest())
        }

        if (message.text === '/generate_post') {
          const post = await this.generatePostService.generatePost()
          await this.sendToModerationService.send(post)
        }
      } catch (error) {
        this.logger.error('Handling message error', error)
      } finally {
        this.editingPromptId = undefined
        this.loading = false
      }
    })
  }

  private getCancelActionRequest(): any {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Cancel',
              callback_data: JSON.stringify({
                event: 'cancel_action',
              }),
            },
          ],
        ],
      },
    }
  }

  private async initializeMenu(): Promise<void> {
    const commands = [
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
      {
        command: 'prompts',
        description: 'Manage prompts',
      },
      {
        command: 'add_prompt',
        description: 'Add prompt',
      },
    ]

    await this.bot.setMyCommands(commands)
  }

  private async setTyping(chatId: string): Promise<void> {
    this.logger.log(`Typing started for: ${chatId}`)
    await this.bot.sendChatAction(chatId, 'typing')

    const interval = setInterval(async () => {
      if (this.loading === false) {
        clearInterval(interval)

        return
      }

      this.logger.log(`Typing for: ${chatId}`)
      await this.bot.sendChatAction(chatId, 'typing')
    }, 1000)
  }
}
