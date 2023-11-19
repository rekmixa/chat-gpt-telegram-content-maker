import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { PROMPT_TEXT_SEPARATOR } from 'src/constants'
import { PostRepository, PostStatus } from 'src/db/post.repository'
import { PromptRepository } from 'src/db/prompt.repository'

import { ScheduleRepository } from './../db/schedule.repository'
import {
  SettingBooleanValue,
  SettingKey,
  SettingRepository,
} from './../db/setting.repository'
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
  private separatorInfo: string = `Вы также можете использовать сепаратор "${PROMPT_TEXT_SEPARATOR}", чтобы создать множественный промпт`

  constructor(
    @Inject(GeneratePostService)
    private readonly generatePostService: GeneratePostService,
    @Inject(PublishInChannelService)
    private readonly publishInChannelService: PublishInChannelService,
    @Inject(SendToModerationService)
    private readonly sendToModerationService: SendToModerationService,
    @Inject(SchedulePostService)
    private readonly schedulePostService: SchedulePostService,
    @Inject(SkipPostService) private readonly skipPostService: SkipPostService,
    @Inject(PostRepository) private readonly postRepository: PostRepository,
    @Inject(PromptRepository)
    private readonly promptRepository: PromptRepository,
    @Inject(ScheduleRepository)
    private readonly scheduleRepository: ScheduleRepository,
    @Inject(SettingRepository)
    private readonly settingRepository: SettingRepository,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: true,
    })
  }

  async onModuleInit(): Promise<void> {
    await this.initializeMenu()

    this.bot.on('callback_query', async data => {
      try {
        const payload = JSON.parse(data.data)
        if (payload.event === 'toggle_auto') {
          const value = await this.settingRepository.isAutoEnabled()
          await this.settingRepository.set(
            SettingKey.Auto,
            value ? SettingBooleanValue.False : SettingBooleanValue.True,
          )

          await this.bot.editMessageReplyMarkup(
            await this.getSetAutoReplyMarkup(),
            {
              chat_id: data.message.chat.id,
              message_id: data.message.message_id,
            },
          )
          return
        }
        if (payload.event === 'toggle_schedule') {
          const schedule = await this.scheduleRepository.getById(payload.id)
          schedule.is_active = !schedule.is_active
          await this.scheduleRepository.persist(schedule)
          await this.bot.editMessageReplyMarkup(
            await this.getSchedulesReplyMarkup(),
            {
              chat_id: data.message.chat.id,
              message_id: data.message.message_id,
            },
          )

          return
        }

        if (payload.event === 'cancel_action') {
          this.isAddingPrompt = false
          this.editingPromptId = undefined
          await this.bot.editMessageReplyMarkup(
            {},
            {
              chat_id: data.message.chat.id,
              message_id: data.message.message_id,
            },
          )

          return
        }

        if (['edit_prompt', 'remove_prompt'].includes(payload.event)) {
          const prompt = await this.promptRepository.getById(payload.id)
          if (payload.event === 'edit_prompt') {
            this.isAddingPrompt = false
            this.editingPromptId = prompt.id

            await sendMessageToTelegram(
              data.from.id,
              `Отправьте следующим сообщением новый текст для промпта. ${this.separatorInfo}`,
              this.getCancelActionRequest(),
            )
          }

          if (payload.event === 'remove_prompt') {
            this.isAddingPrompt = false
            await this.promptRepository.remove(prompt)
            await sendMessageToTelegram(data.from.id, 'Промпт успешно удалён')
          }

          return
        }

        if (
          ['moderate', 'publish', 'schedule', 'skip'].includes(payload.event)
        ) {
          const post = await this.postRepository.getById(payload.id)

          let successMessage: string
          let replyMarkup = null

          if (post.status === PostStatus.Published) {
            replyMarkup = undefined
            successMessage = 'Пост уже был опубликован'
          } else if (payload.event === 'moderate') {
            post.status = PostStatus.Moderating
            await this.postRepository.persist(post)
          } else if (payload.event === 'publish') {
            await this.publishInChannelService.publish(post)
            replyMarkup = undefined
            successMessage = 'Пост опубликован'
          } else if (payload.event === 'schedule') {
            await this.schedulePostService.schedule(post)
            successMessage = 'Пост отправлен в расписание на публикацию'
          } else if (payload.event === 'skip') {
            await this.skipPostService.skip(post)
            successMessage = 'Пост исключён из расписания на публикацию'
          }

          if (replyMarkup !== undefined) {
            replyMarkup = this.sendToModerationService.getReplyMarkup(post)
          }

          await this.bot.editMessageReplyMarkup(replyMarkup, {
            chat_id: data.message.chat.id,
            message_id: data.message.message_id,
          })

          if (successMessage !== undefined) {
            await sendMessageToTelegram(data.from.id, successMessage)
          }
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
          await sendMessageToTelegram(
            message.chat.id,
            `Chat ID: ${message.chat.id}`,
          )
        }

        if (message.text === '/ping') {
          await sendMessageToTelegram(message.chat.id, 'pong')
        }

        if (
          String(message.chat.id) !== String(process.env.TELEGRAM_ADMIN_CHAT_ID)
        ) {
          this.logger.warn('Access denied')

          return
        }

        if (this.isAddingPrompt === true) {
          this.isAddingPrompt = false
          await this.promptRepository.persist({ text: message.text })
          await sendMessageToTelegram(message.chat.id, 'Промпт успешно создан')

          return
        }

        if (this.editingPromptId !== undefined) {
          const prompt = await this.promptRepository.getById(
            this.editingPromptId,
          )
          prompt.text = message.text
          await this.promptRepository.persist(prompt)
          await sendMessageToTelegram(
            message.chat.id,
            'Промпт успешно обновлён',
          )

          return
        }

        if (message.text === '/generate_post') {
          const hasPrompts = await this.promptRepository.hasAnyActive()
          if (hasPrompts === false) {
            await sendMessageToTelegram(
              message.chat.id,
              'Вы не добавили ни одного промпта. Добавьте хотя бы один',
            )
            return
          }

          const post = await this.generatePostService.generatePost()
          await this.sendToModerationService.send(post)
        }

        if (message.text === '/prompts') {
          const prompts = await this.promptRepository.findAllActive()

          if (prompts.length === 0) {
            await sendMessageToTelegram(
              message.chat.id,
              'Нет ни одного промпта. Добавьте первый!',
            )
            return
          }

          for (const prompt of prompts) {
            await sendMessageToTelegram(message.chat.id, prompt.text, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: 'Изменить',
                      callback_data: JSON.stringify({
                        event: 'edit_prompt',
                        id: prompt.id,
                      }),
                    },
                    {
                      text: 'Удалить',
                      callback_data: JSON.stringify({
                        event: 'remove_prompt',
                        id: prompt.id,
                      }),
                    },
                  ],
                ],
              },
            })
          }
        }

        if (message.text === '/add_prompt') {
          this.isAddingPrompt = true
          await sendMessageToTelegram(
            message.chat.id,
            `Отправьте следующим сообщением текст промпта. ${this.separatorInfo}`,
            this.getCancelActionRequest(),
          )
        }

        if (message.text === '/schedules') {
          await sendMessageToTelegram(
            message.chat.id,
            'Расписание публикации:',
            {
              reply_markup: await this.getSchedulesReplyMarkup(),
            },
          )
        }

        if (message.text === '/set_auto') {
          await sendMessageToTelegram(
            message.chat.id,
            'При включённом автономном режиме, сообщения будут сразу попадать в очередь на публикацию. Но возможность ручной модерации всё равно останется:',
            {
              reply_markup: await this.getSetAutoReplyMarkup(),
            },
          )
        }
      } catch (error) {
        console.log(error)
        this.logger.error('Handling message error', error)
      } finally {
        this.editingPromptId = undefined
        this.loading = false
      }
    })
  }

  private async getSetAutoReplyMarkup(): Promise<any> {
    const value = await this.settingRepository.get(SettingKey.Auto)

    return {
      inline_keyboard: [
        [
          {
            text: `${
              value === SettingBooleanValue.True
                ? '🚫 Отключить'
                : '✅ Включить'
            } `,
            callback_data: JSON.stringify({
              event: 'toggle_auto',
            }),
          },
        ],
      ],
    }
  }

  private async getSchedulesReplyMarkup(): Promise<any> {
    const schedules = await this.scheduleRepository.getSchedules()

    return {
      inline_keyboard: [
        ...schedules.map(schedule => {
          return [
            {
              text: `${schedule.is_active ? '✅' : '🚫'} ${schedule.time}`,
              callback_data: JSON.stringify({}),
            },
            {
              text: schedule.is_active ? 'Отключить' : 'Включить',
              callback_data: JSON.stringify({
                event: 'toggle_schedule',
                id: schedule.id,
              }),
            },
          ]
        }),
      ],
    }
  }

  private getCancelActionRequest(): any {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Отменить действие',
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
        description: 'Старт',
      },
      {
        command: 'ping',
        description: 'Пинг',
      },
      {
        command: 'generate_post',
        description: 'Сгенерировать пост, используя рандомный промпт из набора',
      },
      {
        command: 'prompts',
        description: 'Упраление промптами',
      },
      {
        command: 'add_prompt',
        description: 'Добавить промпт',
      },
      {
        command: 'schedules',
        description: 'Настройки расписания',
      },
      {
        command: 'set_auto',
        description: 'Автономный режим',
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
