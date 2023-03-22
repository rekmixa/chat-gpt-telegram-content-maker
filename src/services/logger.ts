import { ConsoleLogger } from '@nestjs/common'
import { clc } from '@nestjs/common/utils/cli-colors.util'
import { bytesToSize, showUptime } from 'src/helpers'
import { sendMessageToAdmin } from 'src/telegram/telegram.module'

declare type messageColor = 'green' | 'red' | 'yellow' | 'magentaBright' | 'cyanBright'

export default class Logger extends ConsoleLogger {
  log(message: any, context?: string) {
    super.log(this.prepareLogMessage(message, 'green'), context)
  }

  error(message: any, trace?: string, context?: string) {
    super.error(this.prepareLogMessage(message, 'red'), trace, context)

    sendMessageToAdmin(`${message}, ${trace}`)
      .catch((error) => {
        super.error(this.prepareLogMessage('Error while reporting log to telegram', 'red'), error)
      })
  }

  warn(message: any, context?: string) {
    super.warn(this.prepareLogMessage(message, 'yellow'), context)
  }

  debug(message: any, context?: string) {
    super.debug(this.prepareLogMessage(message, 'magentaBright'), context)
  }

  verbose(message: any, context?: string) {
    super.verbose(this.prepareLogMessage(message, 'cyanBright'), context)
  }

  private prepareLogMessage(message: string, color: messageColor): string {
    const uptime = this.colorString(`[UPTIME - ${showUptime()}]`, 'cyanBright')
    const ramUsage = process.memoryUsage().heapUsed
    const ramUsageString = bytesToSize(ramUsage)
    const ramMessage = this.colorString(`[RAM: ${ramUsageString}]`, 'magentaBright')

    return `${uptime} ${ramMessage} ${this.colorString(message, color)}`
  }

  private colorString(string: string, color: messageColor): string {
    return clc[color](string)
  }
}
