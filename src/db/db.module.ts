import { Module } from '@nestjs/common'
import { KnexModule } from 'nestjs-knex'
import { PostRepository } from './post.repository'
import config from '../../knexfile'
import { PromptRepository } from './prompt.repository'

@Module({
  imports: [
    KnexModule.forRoot({
      config,
    }),
  ],
  providers: [PostRepository, PromptRepository],
  exports: [PostRepository, PromptRepository]
})
export class DbModule { }
