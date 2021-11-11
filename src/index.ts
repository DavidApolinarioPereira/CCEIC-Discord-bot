import Bot from './bot.js'
import BotConfiguration from './config.js'

function main (): void {
  const config = BotConfiguration.fromEnv()
  const bot = new Bot(config)

  bot.start()
}

main()
