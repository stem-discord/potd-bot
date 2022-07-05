# Written by: XpioWold; July 2022; please see LICENSE

# Get ENV
# set up bot - send message in dev channel and in terminal
# set up reading and writing to DB
# set up submiting quetions
# set up sending the submits and auth by mods
import os, discord, json
from dotenv import load_dotenv

load_dotenv()

def updateDB(database, path):
    jsonToWrite = json.dumps(database, indent=4)
    
    with open(path, "w") as outfile:
        outfile.write(jsonToWrite)
        outfile.close

def readDB(path):
    file = open(path)
    database = json.load(file)
    file.close

    return database

bot = discord.Client()

database_path="./resources/puzzleDB.json"
update_channel=int(os.getenv("BOT_UPDATE_CHANNEL"))
bot_version="0.0.1"
bot_id=int(os.getenv("BOT_ID"))
bot_token = os.getenv("DISCORD_BOT_TOKEN")

database = readDB(database_path)
database["currentPuzzleIndex"] = 1
updateDB(database, database_path)

#events
@bot.event
async def on_ready():
    await bot.change_presence(activity=discord.Game(name="with question marks"))

    await bot.get_channel(update_channel).send("I'm online!")
    print(f"I'm online as @{bot.get_user(bot_id)}\nDiscord API version: {discord.__version__}\nBot version: {bot_version}")

bot.run(bot_token)