import { Module } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { DbModule } from 'src/db/db.module'
import { delay } from './../helpers/index'
import { GeneratePostService } from './generate-post.service'
import { OpenAiService } from './open-ai.service'
import { PublishInChannelService } from './publish-in-channel.service'
import { SchedulePostService } from './schedule-post.service'
import { SendToModerationService } from './send-to-moderation.service'
import { SkipPostService } from './skip-post.service'
import { TelegramService } from './telegram.service'

export async function sendMessageToTelegram(chatId: string, content: string, request?: any, tries: number = 5): Promise<void> {
  const client = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)

  for (let i = tries; i > 0; i--) {
    try {
      await client.sendMessage(chatId, content, request)
      break
    } catch (error) {
      if (i === 1) {
        throw error
      }

      await delay(5000)
    }
  }
}

export async function sendMessageToAdmin(content: string, request?: any, tries: number = 5): Promise<void> {
  await sendMessageToTelegram(process.env.TELEGRAM_ADMIN_CHAT_ID, content, request)
}

export async function sendMessageToChannel(content: string, request?: any, tries: number = 5): Promise<void> {
  await sendMessageToTelegram(process.env.TELEGRAM_CHANNEL_CHAT_ID, content, request)
}

@Module({
  imports: [DbModule],
  providers: [
    OpenAiService,
    TelegramService,
    GeneratePostService,
    SendToModerationService,
    SchedulePostService,
    PublishInChannelService,
    SkipPostService,
  ],
  exports: [
    GeneratePostService,
    PublishInChannelService,
    SendToModerationService,
  ],
})
export class TelegramModule { }
