import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TelegramModule } from 'src/telegram/telegram.module'
import { TasksService } from './tasks.service'

@Module({
  imports: [ScheduleModule.forRoot(), TelegramModule],
  providers: [TasksService]
})
export class TasksModule { }
