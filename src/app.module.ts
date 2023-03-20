import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TelegramModule } from './telegram/telegram.module'
import { OpenAiService } from './telegram/open-ai.service'
import { DbModule } from './db/db.module'

@Module({
  imports: [ConfigModule.forRoot(), TelegramModule, DbModule],
  providers: [OpenAiService],
})
export class AppModule implements OnApplicationBootstrap {
  private logger: Logger = new Logger('AppModule')

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('onApplicationBootstrap')
  }
}
