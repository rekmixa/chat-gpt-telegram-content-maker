import { Inject, Injectable, Logger } from '@nestjs/common'
import { Post, PostRepository, PostStatus } from 'src/db/post.repository'
import { sendMessageToChannel } from './telegram.module'

@Injectable()
export class PublishInChannelService {
  private readonly logger: Logger = new Logger(PublishInChannelService.name)

  constructor(
    @Inject(PostRepository) private readonly postRepository: PostRepository,
  ) { }

  async publish(post: Post): Promise<void> {
    post.status = PostStatus.Published
    await this.postRepository.persist(post)
    await sendMessageToChannel(post.content)
    this.logger.log('Post has been published')
  }
}
