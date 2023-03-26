import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Post } from 'src/db/post.repository'
import { GeneratePostService } from 'src/telegram/generate-post.service'
import { PublishInChannelService } from 'src/telegram/publish-in-channel.service'
import { SendToModerationService } from 'src/telegram/send-to-moderation.service'
import { sendMessageToAdmin } from 'src/telegram/telegram.module'

import { PostRepository } from './../db/post.repository'
import { PromptRepository } from './../db/prompt.repository'
import { ScheduleRepository } from './../db/schedule.repository'
import { delay } from './../helpers'

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name)

  constructor(
    @Inject(PostRepository) private readonly postRepository: PostRepository,
    @Inject(PromptRepository)
    private readonly promptRepository: PromptRepository,
    @Inject(ScheduleRepository)
    private readonly scheduleRepository: ScheduleRepository,
    @Inject(GeneratePostService)
    private readonly generatePostService: GeneratePostService,
    @Inject(PublishInChannelService)
    private readonly publishInChannelService: PublishInChannelService,
    @Inject(SendToModerationService)
    private readonly sendToModerationService: SendToModerationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  async generatePosts(): Promise<void> {
    this.logger.debug('Generating posts for schedule')
    const hasAnyPrompts = await this.promptRepository.hasAnyActive()
    if (hasAnyPrompts === false) {
      this.logger.warn('You have not added any prompts. Add at least one')

      return
    }

    const posts: Post[] = []
    const activeSchedulesCount = await this.scheduleRepository.getActiveSchedulesCount()

    for (let i = 0; i < activeSchedulesCount; i++) {
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

  @Cron('0 * * * *')
  async publishScheduledPosts(): Promise<void> {
    const hours = new Date().getHours()
    const time = `${hours < 10 ? 0 : ''}${hours}:00`
    const schedule = await this.scheduleRepository.findByTime(time)
    if (schedule === null) {
      this.logger.log('Schedule for current time does not exists')
      return
    }

    this.logger.debug('Publishind scheduled post')

    try {
      const post = await this.postRepository.findOldestScheduled()
      if (post === null) {
        this.logger.warn('No post to publish')
        await sendMessageToAdmin('No post to publish')
      } else {
        await this.publishInChannelService.publish(post)
      }
    } catch (error) {
      this.logger.error('Error publishing post', error)
    }
  }
}
