import { config } from 'dotenv'

config() // for .env files
export default class BotConfiguration {
  private static readonly DISCORD_TOKEN_KEY = 'DISCORD_TOKEN'
  discordToken: string

  private static readonly MODULES_PATH_KEY = 'MODULES_PATH'
  modulesPath: string

  private static readonly PREFIX_KEY = 'PREFIX'
  prefix: string

  private constructor () {
    this.discordToken = ''
    this.modulesPath = ''
    this.prefix = ''
  }

  static fromEnv (): BotConfiguration {
    const config = new BotConfiguration()

    const token = process.env[this.DISCORD_TOKEN_KEY]
    if (token === undefined) {
      throw new Error(`Missing Discord Token, please set the ${this.DISCORD_TOKEN_KEY} environment variable`)
    }
    config.discordToken = token

    const modulesPath = process.env[this.MODULES_PATH_KEY]
    if (modulesPath === undefined) {
      config.modulesPath = '.'
      console.warn(`${this.MODULES_PATH_KEY} environment variable missing. Assuming modules path is '${config.modulesPath}'`)
    } else {
      config.modulesPath = modulesPath
    }

    return config
  }
}
