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
    await sendMessageToChannel(post.content)
    post.status = PostStatus.Published
    await this.postRepository.persist(post)
    this.logger.log('Post has been published')
  }
}
