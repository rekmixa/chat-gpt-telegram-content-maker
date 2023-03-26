import { ScheduleRepository } from './schedule.repository'
import { Module } from '@nestjs/common'
import { KnexModule } from 'nestjs-knex'
import { PostRepository } from './post.repository'
import config from '../../knexfile'
import { PromptRepository } from './prompt.repository'
import { SettingRepository } from './setting.repository'

@Module({
  imports: [
    KnexModule.forRoot({
      config,
    }),
  ],
  providers: [
    PostRepository,
    PromptRepository,
    ScheduleRepository,
    SettingRepository,
  ],
  exports: [
    PostRepository,
    PromptRepository,
    ScheduleRepository,
    SettingRepository,
  ],
})
export class DbModule {}
