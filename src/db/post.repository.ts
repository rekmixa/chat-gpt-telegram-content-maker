import { Injectable } from '@nestjs/common'
import { InjectKnex, Knex } from 'nestjs-knex'

export interface Post {
  readonly id?: number
  content: string
  is_published?: boolean
  readonly created_at?: Date
  readonly updated_at?: Date
}

@Injectable()
export class PostRepository {
  private readonly tableName: string = 'posts'

  constructor(
    @InjectKnex() private readonly knex: Knex,
  ) { }

  async findById(id: number): Promise<Post | null> {
    const post = await this.knex
      .from<Post>(this.tableName)
      .select('*')
      .where('id', id)
      .first()

    if (post) {
      return post
    }

    return null
  }

  async findOldestNotPublished(): Promise<Post | null> {
    const post = await this.knex
      .from<Post>(this.tableName)
      .select('*')
      .where('is_published', false)
      .orderBy('id', 'asc')
      .first()

    if (post) {
      return post
    }

    return null
  }

  async persist(post: Post): Promise<Post> {
    let result: Post[]
    if (post.id !== undefined) {
      result = await this.knex
        .table<Post>(this.tableName)
        .where('id', post.id)
        .returning('*')
        .update({
          ...post,
          updated_at: new Date()
        })
    } else {
      result = await this.knex
        .table<Post>(this.tableName)
        .returning('*')
        .insert(post)
    }

    if (result[0] === undefined) {
      throw new Error('Cannot save post')
    }

    return result[0]
  }
}
