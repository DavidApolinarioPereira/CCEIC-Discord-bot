import Discord from 'discord.js'
import BotConfiguration from './config'

export default class Bot {
  private readonly client: Discord.Client

  constructor (config: BotConfiguration) {
    this.client = new Discord.Client({
      intents: [
        Discord.Intents.FLAGS.GUILDS
        // ?
      ]
    })
  }
}
