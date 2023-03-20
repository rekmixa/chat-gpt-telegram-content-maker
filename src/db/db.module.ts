import { Module } from '@nestjs/common'
import { KnexModule } from 'nestjs-knex'
import { PostRepository } from './post.repository'
import config from '../../knexfile'

@Module({
  imports: [
    KnexModule.forRoot({
      config,
    }),
  ],
  providers: [PostRepository],
  exports: [PostRepository]
})
export class DbModule { }
