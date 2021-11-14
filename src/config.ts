import { config } from 'dotenv'

config() // for .env files
export default class BotConfiguration {
  private static readonly DISCORD_TOKEN_KEY = 'DISCORD_TOKEN'
  discordToken: string = ''

  private static readonly MODULES_PATH_KEY = 'MODULES_PATH'
  modulesPath: string = './src/module_bank'

  private static readonly CLIENT_ID_KEY = 'CLIENT_ID'
  clientId: string = '907322243586089034'

  private static readonly GUILD_ID_KEY = 'GUILD_ID'
  guildId: string = '893092430935646209'

  private constructor () {}

  static fromEnv (): BotConfiguration {
    const config = new BotConfiguration()

    const token = process.env[this.DISCORD_TOKEN_KEY]
    if (token === undefined) {
      throw new Error(`Missing Discord Token, please set the ${this.DISCORD_TOKEN_KEY} environment variable`)
    }
    config.discordToken = token

    const modulesPath = process.env[this.MODULES_PATH_KEY]
    if (modulesPath === undefined) {
      console.warn(`${this.MODULES_PATH_KEY} environment variable missing. Assuming modules path is '${config.modulesPath}'`)
    } else {
      config.modulesPath = modulesPath
    }

    const clientId = process.env[this.CLIENT_ID_KEY]
    if (clientId === undefined) {
      console.warn(`${this.CLIENT_ID_KEY} environment variable missing. Assuming client ID is '${config.clientId}'`)
    } else {
      config.clientId = clientId
    }

    const guildId = process.env[this.GUILD_ID_KEY]
    if (guildId === undefined) {
      console.warn(`${this.GUILD_ID_KEY} environment variable missing. Assuming guild ID is '${config.guildId}'`)
    } else {
      config.guildId = guildId
    }


    return config
  }
}
