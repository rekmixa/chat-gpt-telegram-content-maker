import { Module } from '@nestjs/common'
import { TelegramService } from './telegram.service'
import { OpenAiService } from './open-ai.service'

@Module({
  providers: [OpenAiService, TelegramService]
})
export class TelegramModule {}
