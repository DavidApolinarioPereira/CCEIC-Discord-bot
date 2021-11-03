import BotConfiguration from "./config";
import Discord from 'discord.js'

function test(){
    var testVar = "ola" // so para nao dar erro
    new Discord.MessageActionRow().addComponents(
        new Discord.MessageSelectMenu()
            .setCustomId(`roleSelection:${testVar}`)
            .setPlaceholder(testVar)
            .setMinValues("group.minValues ?? 1")
            .setMaxValues(
                // ((v) => (v < 0 ? group.options.length : v))(
                //     group.maxValues ?? 1
                // )
            )
            .addOptions(
                // group.options as Discord.MessageSelectOptionData[]
            )
    )
}