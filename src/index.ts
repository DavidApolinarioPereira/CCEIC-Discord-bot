import Bot from './bot.js'
import BotConfiguration from './config.js'

async function main (): Promise<void> {
  const config = BotConfiguration.fromEnv()
  const bot = new Bot(config)

  await bot.start()
}

main()
