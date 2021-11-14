# CCEIC-Discord-bot

### How to use it:
To use the bot the user must type `/start` and it will show a list of modules. To select the desired module the user can use the arrow keys or select it with the mouse. After selecting it just the user may press the return key so the interaction begins. Each module starts by showing a brief description of it, a video, and reference links. When the user feels comfortable with the subject he can press the `Next` button so the preparation questions begin. The user can then answer these questions and when done he may repeat them by pressing `I need to practice again...` or advance to the evaluation questions by pressing the `Let's go!` button. The user then answers the evaluation questions. At the end a score is given and if a fun fact exists it is also shown. The user can then repeat the evaluation questions by pressing `I'll have another go` or go to the beginning of the module by pressing `Restart Module (go back to the very beginning)`. At any moment the user may also choose another module by typing `/start` and choosing it.

### Deploying the bot yourself

#### Setup
1. Create a new application in https://discord.com/developers/applications

2. In the application Bot section, enable the Bot user

#### Adding the bot to your server
1. Go to the application's OAuth section in Discord's developers website (from the setup)

2. Add any URL as a redirect (e.g. https://google.com)

3. Select the following scopes:
- bot
- application.commands

4. Also enable the following bot permissions:
- Send Messages
- Public Threads
- Private Threads
- Send Messages In Threads
- Embed Links
- Attach Files

5. Save your changes, and go to the generated URL (above the Bot Permissions section) to add the bot to your server!

#### Deploying the bot
0. YOU DID ADD IT TO YOUR SERVER DIDN'T YOU? If you did not you'll get a "You are not authorized to perform this action on this application" error when starting the bot.

1. Ensure you have NodeJS 16 or greater installed, and open a shell/terminal

2. Run `npm install` on the root of this repository

3. Go to the application's Bot section in Discord's developers website (from the setup) and copy the bot token.
   Add it to the current shell's environment with `export DISCORD_TOKEN=thetokenyoucopied`

4. Go to the application's OAuth2 section in Discord's developers website (from the setup) and copy the bot's OAuth2 client ID.
  Add it to the current shell's environment with `export CLIENT_ID=theidyoucopied`

5. Go to your Discord server (any channel or thread), and copy the server ID from the URL: it's the number after `https://discord.com/channels/`.
  Add it to the current shell's environment with `export GUILD_ID=theidyoucopied`

6. Run `npm start`. You know it's working when you see the message `Sucessfully reloaded application (/) commands`!