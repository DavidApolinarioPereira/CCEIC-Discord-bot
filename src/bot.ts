import Discord, { MessageActionRow } from 'discord.js'
import { addAbortSignal } from 'stream'
import BotConfiguration from './config'
import { ModuleExecution, ModuleRegistry } from './modules'
import { ModuleExecutionEnd, ModuleExecutionError, ModuleExecutionEvaluation, ModuleExecutionEvaluationPre, ModuleExecutionFormative, ModuleExecutionFormativeFeedback, ModuleExecutionStart } from './modules/execution'
import { ExecutionVisitor } from './modules/executionvisitor'

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

    this.client.on('message', (message: any) => {
      if (!message.content.startsWith(config.prefix) || message.author.bot) return;

      // split is wrong
      const args = message.content.slice(config.prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      if (!this.client.commands.has(commandName)) return;

      const command = this.client.commands.get(commandName);

      try {
        command.execute(message, args);
      } catch (error) {
        console.error(error);
        message.reply("There was an error trying to execute that command!");
      }
    })


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
        if (interaction.isButton()) {
          this.handleButtonInteraction(interaction as Discord.ButtonInteraction)
        }
        break
    }
  }

  handleButtonInteraction(interaction: Discord.ButtonInteraction): void {
    let [state, actionId] = this.parseButtonId(interaction.customId)
    state = state.advance(actionId)

    const renderer = new ModuleExecutionRenderer(this, interaction)
    state.accept(renderer)
  }

  private parseButtonId(customId: string): [ModuleExecution, string] {
    const [actionId, serializedState] = customId.split('-', 2)
    return [ModuleExecution.deserialize(serializedState, this.modules), actionId]
  }

  createButtonId(state: ModuleExecution, actionId: string): string {
    const serializedState = state.serialize()
    return `${actionId}-${serializedState}`
  }

  async start (): Promise<void> {
    await this.client.login(this.config.discordToken)
  }
}

class ModuleExecutionRenderer extends ExecutionVisitor<Promise<void>> {
  constructor(
    private readonly bot: Bot,
    private readonly interaction: Discord.ButtonInteraction
  ) {
    super()
  }


  public async visitStart (e: ModuleExecutionStart): Promise<void> {
    const row = new MessageActionRow()
      .addComponents(
        this.button(e, '_')
          .setLabel('Next')
      )

    await this.interaction.update({
      content: [
        "stuff"
      ].join('\n'),
      components: [row],
    })
  }

  public async visitFormative (e: ModuleExecutionFormative): Promise<void> {

  }

  public async visitFormativeFeedback (e: ModuleExecutionFormativeFeedback): Promise<void> {

  }

  public async visitEvaluationPre (e: ModuleExecutionEvaluationPre): Promise<void> {

  }

  public async visitEvaluation (e: ModuleExecutionEvaluation): Promise<void> {

  }

  public async visitEnd (e: ModuleExecutionEnd): Promise<void> {

  }

  public async visitError (e: ModuleExecutionError): Promise<void> {
    await this.interaction.reply([
      `Error: ${e.message}`,
      'Manually restart module.',
      'If your name is Sofia, Afonso or Roman please ignore :)'
    ].join('\n'))
  }

  private button(ex: ModuleExecution, actionId: string): Discord.MessageButton {
    return new Discord.MessageButton()
      .setCustomId(this.bot.createButtonId(ex, actionId))
  }
}