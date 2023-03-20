import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TelegramModule } from './telegram/telegram.module'
import { OpenAiService } from './telegram/open-ai.service';

@Module({
  imports: [ConfigModule.forRoot(), TelegramModule],
  providers: [OpenAiService],
})
export class AppModule implements OnApplicationBootstrap {
  private logger: Logger = new Logger('AppModule')

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('onApplicationBootstrap')
  }
}
