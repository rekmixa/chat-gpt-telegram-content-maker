import { Inject, Injectable, Logger } from '@nestjs/common'
import { Post, PostRepository, PostStatus } from 'src/db/post.repository'

@Injectable()
export class SkipPostService {
  private readonly logger: Logger = new Logger(SkipPostService.name)

  constructor(
    @Inject(PostRepository) private readonly postRepository: PostRepository,
  ) { }

  async skip(post: Post): Promise<void> {
    post.status = PostStatus.Skipped
    await this.postRepository.persist(post)
    this.logger.log('Post has been skipped')
  }
}
