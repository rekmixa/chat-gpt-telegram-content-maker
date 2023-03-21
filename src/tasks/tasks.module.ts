import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { DbModule } from 'src/db/db.module'
import { TelegramModule } from 'src/telegram/telegram.module'
import { TasksService } from './tasks.service'

@Module({
  imports: [ScheduleModule.forRoot(), DbModule, TelegramModule],
  providers: [TasksService]
})
export class TasksModule { }
