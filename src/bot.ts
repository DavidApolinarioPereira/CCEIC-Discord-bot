import Discord from 'discord.js'
import BotConfiguration from './config'

export default class Bot {
  private readonly client: Discord.Client
  private readonly config: BotConfiguration


  constructor (config: BotConfiguration) {
    this.client = new Discord.Client({
      intents: [
        Discord.Intents.FLAGS.GUILDS
      ]
    })

    this.client.on('ready', this.readyHandler.bind(this))
    this.client.on('interactionCreate', this.interactionCreateHandler.bind(this))


    this.config = config
  }

  readyHandler (): void {
    console.log("Bot up!")
  }

  interactionCreateHandler (interaction: Discord.Interaction): void {
    switch (interaction.type) {
        case "APPLICATION_COMMAND":
            break;
        case "MESSAGE_COMPONENT":
            if (interaction.isButton()) {
                // TODO
            }
            break;
    }
  }

  start (): void {
      this.client.login(this.config.discordToken);
  }
}
