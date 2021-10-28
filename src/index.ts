import Bot from './bot'
import BotConfiguration from './config'

function main (): void {
  const config = BotConfiguration.fromEnv()
  const bot = new Bot(config)

  // bot.start?
}

main()
