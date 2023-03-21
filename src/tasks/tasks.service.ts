import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Post } from 'src/db/post.repository'
import { GeneratePostService } from 'src/telegram/generate-post.service'
import { PublishInChannelService } from 'src/telegram/publish-in-channel.service'
import { SendToModerationService } from 'src/telegram/send-to-moderation.service'
import { delay } from './../helpers/index'

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name)

  constructor(
    @Inject(GeneratePostService) private readonly generatePostService: GeneratePostService,
    @Inject(PublishInChannelService) private readonly publishInChannelService: PublishInChannelService,
    @Inject(SendToModerationService) private readonly sendToModerationService: SendToModerationService,
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async handleCron() {
    this.logger.debug('Generating posts for schedule')
    const posts: Post[] = []

    for (let i = 0; i < 10; i++) {
      try {
        posts.push(await this.generatePostService.generatePost())
        this.logger.verbose(`Post #${i} was generated`)
        await delay(30_000)
      } catch (error) {
        this.logger.error(`Generating #${i} post error`, error)
      }
    }

    for (const post of posts) {
      try {
        await this.sendToModerationService.send(post)
      } catch (error) {
        this.logger.error(`Sending post ${post.id} failed`, error)
      }
    }
  }
}
