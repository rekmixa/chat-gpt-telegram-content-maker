import { Module } from '@nestjs/common'
import { DbModule } from 'src/db/db.module'
import { GeneratePostService } from './generate-post.service'
import { OpenAiService } from './open-ai.service'
import { PublishInChannelService } from './publish-in-channel.service'
import { SchedulePostService } from './schedule-post.service'
import { SendToModerationService } from './send-to-moderation.service'
import { SkipPostService } from './skip-post.service'
import { TelegramService } from './telegram.service'

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
  ]
})
export class TelegramModule { }
