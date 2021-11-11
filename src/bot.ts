import { SlashCommandBuilder, SlashCommandStringOption } from '@discordjs/builders'
import Discord, { CommandInteraction, MessageActionRow } from 'discord.js'
import { MessageButtonStyles } from 'discord.js/typings/enums'
import BotConfiguration from './config.js'
import { ModuleExecution, ModuleRegistry } from './modules/index.js'
import { AnswerAction, EndAction, EvaluationPreActions, ModuleExecutionEnd, ModuleExecutionError, ModuleExecutionEvaluation, ModuleExecutionEvaluationPre, ModuleExecutionFormative, ModuleExecutionFormativeFeedback, ModuleExecutionStart } from './modules/execution.js'
import { ExecutionVisitor } from './modules/executionvisitor.js'
import { REST } from '@discordjs/rest'
import { Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9'
import arrayShuffle from 'array-shuffle'

export default class Bot {
  private readonly client: Discord.Client
  private readonly config: BotConfiguration
  private readonly modules: ModuleRegistry

  constructor (config: BotConfiguration) {
    this.client = new Discord.Client({
      intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
      ]
  
    })

    this.client.on('ready', this.readyHandler.bind(this))
    this.client.on('interactionCreate', this.interactionCreateHandler.bind(this))

    this.config = config
    this.modules = ModuleRegistry.fromDirectory(config.modulesPath)
  }

  readyHandler (): void {
    console.log('Bot up!')
    this.registerCommands()
  }

  registerCommands() {
    const clientId = "907322243586089034"
    const guildId = "893092430935646209"
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = []

    commands.push(
      new SlashCommandBuilder()
        .setName("start")
        .setDescription("start a module")
        .addStringOption(option => 
          option
            .setName("module")
            .setDescription("module name")
            .addChoices(this.modules.entries().map(([key, mod]) => [mod.name, key]))
            .setRequired(true)
        )
        .setDefaultPermission(true)
        .toJSON()
    )
    const rest = new REST({ version: '9' }).setToken(this.config.discordToken);

    (async () => {
      try {
        console.log('Started refreshing application (/) commands.');
        console.log(Routes)


        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
      } catch (error) {
        console.error(error);
      }
    })();
  }

  async interactionCreateHandler (interaction: Discord.Interaction): Promise<void> {
    switch (interaction.type) {
      case 'APPLICATION_COMMAND':
        let cmd = interaction as CommandInteraction
        await cmd.deferReply({ ephemeral: true })
        
        try {
          switch (cmd.commandName) {
            case 'start':
              await this.startModule(cmd)
              break
            default:
              throw new Error('No such command')
          }
        } catch (e) {
          console.error(e)
          console.error((e as Error).stack)
          cmd.editReply(`Error executing command: ${e}`)
        }
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
    console.log('state at button press:')
    console.log(state)
    state = state.advance(actionId)
    console.log('New state *after* button press:')
    console.log(state)

    const renderer = new ModuleExecutionRenderer(this, interaction)
    state.accept(renderer)
  }

  private parseButtonId(customId: string): [ModuleExecution, string] {
    const [actionId, serializedState, _buttonId] = customId.split('-', 3)
    return [ModuleExecution.deserialize(serializedState, this.modules), actionId]
  }

  createButtonId(state: ModuleExecution, actionId: string, buttonId: number): string {
    const serializedState = state.serialize()
    return `${actionId}-${serializedState}-${buttonId}`
  }

  async startModule (interaction: CommandInteraction): Promise<void> {
    const moduleName = interaction.options.getString('module', true)
    const module = this.modules.get(moduleName)
    const execution = ModuleExecution.newForModule(module)
    
    await ModuleExecutionRenderer.initialInteraction(execution, interaction, this)
  }

  async start (): Promise<void> {
    await this.client.login(this.config.discordToken)
  }
}

class ModuleExecutionRenderer extends ExecutionVisitor<Promise<void>> {
  private buttonId = 0
  
  constructor(
    private readonly bot: Bot,
    private readonly interaction: Discord.ButtonInteraction
  ) {
    super()
  }

  public static async initialInteraction(e: ModuleExecutionStart, interaction: Discord.ButtonInteraction|Discord.CommandInteraction, bot: Bot): Promise<void> {
    await interaction.editReply(ModuleExecutionRenderer.initialMessage(e, bot) as Discord.WebhookEditMessageOptions)
  }

  public async visitStart (e: ModuleExecutionStart): Promise<void> {
    await this.interaction.update(ModuleExecutionRenderer.initialMessage(e, this.bot))
  }

  private static initialMessage(e: ModuleExecutionStart, bot: Bot): Discord.InteractionUpdateOptions {
    const row = new MessageActionRow()
      .addComponents(
        new Discord.MessageButton()
          .setCustomId(bot.createButtonId(e, '_', 0))
          .setStyle(MessageButtonStyles.PRIMARY)
          .setLabel('Next')
      )

    return {
      content: [
        `**${e.module.name}**`,
        e.module.description,
        '',
        `Before starting you should check out ${e.module.videoUri}`,
        '',
        '**How will this work**',
        `After clicking next you will answer ${e.module.formativeQuestions.length} questions that should use to improve your knowledge: you can retry them until you answer right!`,
        `Following those, you have the chance to go back to the beginning or start the evaluation.`,
        '',
        '**References**',
        ...Object.entries(e.module.references).map((name, url) => `- ${name}: ${url}`),
        '',
        'See you on the other side!',
      ].join('\n'),
      components: [row],
    }
  }

  public async visitFormative (e: ModuleExecutionFormative): Promise<void> {
    const question = e.question()

    const options = arrayShuffle(
      question.correctAnswers.map(ans => [ans, AnswerAction.Correct])
        .concat(question.wrongAnswers.map(ans => [ans, AnswerAction.Incorrect]))
    )

    const components = options.map(([answer, actionId], idx) => new MessageActionRow().addComponents(
      this.buttonAnswer(e, idx, actionId as AnswerAction)
    ))

    this.interaction.update({
      content: [
        `**${e.module.name}**`,
        `**Question ${e.questionNumber + 1}/${e.module.formativeQuestions.length}**`,
        question.question,
        '',
        ...options.map(([answer, _actionId], idx) => `${idx}. ${answer}`)
      ].join('\n'),
      components,
    })
  }

  public async visitFormativeFeedback (e: ModuleExecutionFormativeFeedback): Promise<void> {
    let feedback: string
    if (e.isRightAnswer()) {
      feedback = e.question().feedbackForCorrect ?? "That's right! Keep going!"
    } else {
      feedback = e.question().feedbackForWrong ?? "Not quite. Try again!"
    }
    
    this.interaction.update({
      content: [
        `**${e.module.name}**`,
        `**Question ${e.questionNumber +1 }/${e.module.formativeQuestions.length}**`,
        feedback,
      ].join('\n'),
      components: [
        new MessageActionRow()
          .addComponents(
            this.button(e, '_')
              .setStyle(MessageButtonStyles.PRIMARY)
              .setLabel(e.isRightAnswer() ? "Next" : "Retry")
          )
      ]
    })
  }

  public async visitEvaluationPre (e: ModuleExecutionEvaluationPre): Promise<void> {
    this.interaction.update({
      content: [
        `**${e.module.name}**`,
        'Ok, let\'s stop for a second.',
        '',
        'When you click **Next**, you will start your **evaluation**.',
        `You will be presented with ${e.module.evaluationQuestions.length} questions to test your knowledge`,
        'In the end you will see your score, and be offered the chance to try again.'
      ].join('\n'),
      components: [new MessageActionRow().addComponents(
        this.button(e, EvaluationPreActions.Continue)
          .setStyle(MessageButtonStyles.DANGER)
          .setLabel("Let's go!"),
        this.button(e, EvaluationPreActions.Restart)
          .setStyle(MessageButtonStyles.SECONDARY)
          .setLabel("I need to practice again...")
      )]
    })
  }

  public async visitEvaluation (e: ModuleExecutionEvaluation): Promise<void> {
    const question = e.question()

    const options = arrayShuffle(
      question.correctAnswers.map(ans => [ans, AnswerAction.Correct])
        .concat(question.wrongAnswers.map(ans => [ans, AnswerAction.Incorrect]))
    )

    const components = options.map(([answer, actionId], idx) => new MessageActionRow().addComponents(
      this.buttonAnswer(e, idx, actionId as AnswerAction)
    ))

    this.interaction.update({
      content: [
        `**${e.module.name}**`,
        `**Question ${e.questionNumber + 1}/${e.module.evaluationQuestions.length}**`,
        question.question,
        '',
        ...options.map(([answer, _actionId], idx) => `${idx}. ${answer}`)
      ].join('\n'),
      components,
    })
  }

  public async visitEnd (e: ModuleExecutionEnd): Promise<void> {
    const score = Math.round(e.score / e.module.evaluationQuestions.length * 100)

    let score_comment
    if (score > 80) {
      score_comment = "Congrats!"
    } else if (score > 50) {
      score_comment = "I'm sure that with a bit of practice you can do even better!"
    } else {
      score_comment = "I think you should study a bit more..."
    }

    this.interaction.update({
      content: [
        `**${e.module.name}**`,
        `You scored ${score}% ${score_comment}`,
        arrayShuffle(e.module.funFacts.slice(0))[0] ?? '',
      ].join('\n'),
      components: [new MessageActionRow().addComponents(
        this.button(e, EndAction.RestartEvaluation)
          .setStyle(MessageButtonStyles.PRIMARY)
          .setLabel("I'll have another go"),
        this.button(e, EndAction.RestartModule)
          .setStyle(MessageButtonStyles.SECONDARY)
          .setLabel("Restart Module (go back to the very beginning)")
      )]
    })
  }

  public async visitError (e: ModuleExecutionError): Promise<void> {
    await this.interaction.editReply([
      `**${e.module?.name ?? 'Unknown module'}**`,
      `Error: ${e.message}`,
      'Manually restart module.',
      'If your name is Sofia, Afonso or Roman please ignore :)'
    ].join('\n'))
  }

  private buttonAnswer(ex: ModuleExecution, answerIdx: number, actionId: AnswerAction): Discord.MessageButton {
    return this.button(ex, actionId)
      .setLabel(answerIdx.toString())
      .setStyle(MessageButtonStyles.PRIMARY)
  }

  private button(ex: ModuleExecution, actionId: string): Discord.MessageButton {
    return new Discord.MessageButton()
      .setCustomId(this.bot.createButtonId(ex, actionId, this.buttonId++))
  }
}