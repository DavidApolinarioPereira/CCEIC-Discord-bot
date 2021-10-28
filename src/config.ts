export default class BotConfiguration {
  private static readonly DISCORD_TOKEN_KEY = 'DISCORD_TOKEN'
  discordToken: String

  private constructor () {
    this.discordToken = ''
  }

  static fromEnv (): BotConfiguration {
    const config = new BotConfiguration()

    const token = process.env[this.DISCORD_TOKEN_KEY]
    if (token === undefined) {
      throw new Error(`Missing Discord Token, please set the ${this.DISCORD_TOKEN_KEY} environment variable`)
    }
    config.discordToken = token

    return config
  }
}
