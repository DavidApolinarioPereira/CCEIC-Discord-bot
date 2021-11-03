import Discord from 'discord.js'
import BotConfiguration from './config'
import { ModuleExecution, ModuleRegistry } from './modules'

export default class Bot {
  private readonly client: Discord.Client
  private readonly config: BotConfiguration
  private readonly modules: ModuleRegistry

  constructor (config: BotConfiguration) {
    this.client = new Discord.Client({
      intents: [
        Discord.Intents.FLAGS.GUILDS
      ]
    })

    this.client.on('ready', this.readyHandler.bind(this))
    this.client.on('interactionCreate', this.interactionCreateHandler.bind(this))

    this.config = config
    this.modules = ModuleRegistry.fromDirectory(config.modulesPath)
  }

  readyHandler (): void {
    console.log('Bot up!')
  }

  interactionCreateHandler (interaction: Discord.Interaction): void {
    switch (interaction.type) {
      case 'APPLICATION_COMMAND':
        break
      case 'MESSAGE_COMPONENT':
        // TODO
        // let execution = ModuleExecution.deserialize(...)
        if (interaction.isButton()) {
          // execution = execution.consumestuffthings(...)
          // const serialized = execution.serialize()

          // post buttons with right id (`${serialized}-${idx}`)
        }
        break
    }
  }

  async start (): Promise<void> {
    await this.client.login(this.config.discordToken)
  }
}
