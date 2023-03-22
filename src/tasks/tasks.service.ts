import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Post } from 'src/db/post.repository'
import { GeneratePostService } from 'src/telegram/generate-post.service'
import { PublishInChannelService } from 'src/telegram/publish-in-channel.service'
import { SendToModerationService } from 'src/telegram/send-to-moderation.service'
import { sendMessageToAdmin } from 'src/telegram/telegram.module'
import { PostRepository } from './../db/post.repository'
import { delay } from './../helpers/index'

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name)

  constructor(
    @Inject(PostRepository) private readonly postRepository: PostRepository,
    @Inject(GeneratePostService) private readonly generatePostService: GeneratePostService,
    @Inject(PublishInChannelService) private readonly publishInChannelService: PublishInChannelService,
    @Inject(SendToModerationService) private readonly sendToModerationService: SendToModerationService,
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_7PM)
  async generatePosts(): Promise<void> {
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

  @Cron('0 9-18 * * *')
  async publishScheduledPosts(): Promise<void> {
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
