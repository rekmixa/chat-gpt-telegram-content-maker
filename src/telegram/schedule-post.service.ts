import { Inject, Injectable, Logger } from '@nestjs/common'
import { Post, PostRepository, PostStatus } from 'src/db/post.repository'

@Injectable()
export class SchedulePostService {
  private readonly logger: Logger = new Logger(SchedulePostService.name)

  constructor(
    @Inject(PostRepository) private readonly postRepository: PostRepository,
  ) { }

  async schedule(post: Post): Promise<void> {
    this.logger.log('Scheduling a post...')
    post.status = PostStatus.Scheduled
    await this.postRepository.persist(post)
  }
}
