import { Inject, Injectable, Logger } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { Post, PostRepository, PostStatus } from 'src/db/post.repository'

@Injectable()
export class PublishInChannelService {
  private readonly logger: Logger = new Logger(PublishInChannelService.name)
  private readonly bot: TelegramBot

  constructor(
    @Inject(PostRepository) private readonly postRepository: PostRepository,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
  }

  async publish(post: Post): Promise<void> {
    post.status = PostStatus.Published
    await this.postRepository.persist(post)
    await this.bot.sendMessage(process.env.TELEGRAM_CHANNEL_CHAT_ID, post.content)
    this.logger.log('Post has been published')
  }
}
