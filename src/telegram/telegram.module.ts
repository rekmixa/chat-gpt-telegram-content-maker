import { Module } from '@nestjs/common'
import { DbModule } from 'src/db/db.module'
import { OpenAiService } from './open-ai.service'
import { TelegramService } from './telegram.service'

@Module({
  imports: [DbModule],
  providers: [OpenAiService, TelegramService]
})
export class TelegramModule {}
