# Written by: XpioWold; July 2022; please see LICENSE

# Get ENV
# set up bot - send message in dev channel and in terminal
# set up reading and writing to DB
# set up submiting quetions
# set up sending the submits and auth by mods
import os, interactions, discord, json, asyncio
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

database_path="./resources/puzzleDB.json"
update_channel=int(os.getenv("BOT_UPDATE_CHANNEL"))
bot_version="0.0.1"
bot_id=int(os.getenv("BOT_ID"))
bot_token = os.getenv("DISCORD_BOT_TOKEN")

bot_interactions_client = interactions.Client(token=bot_token)
bot_discord_client = discord.Client()

database = readDB(database_path)

#events
@bot_discord_client.event
async def on_ready():
    await bot_discord_client.change_presence(activity=discord.Game(name="with question marks"))

    await bot_discord_client.get_channel(update_channel).send("I'm online!")
    print(f"I'm online as @{bot_discord_client.get_user(bot_id)}\nDiscord API version: {discord.__version__}\nBot version: {bot_version}")

loop = asyncio.get_event_loop()

task2 = loop.create_task(bot_discord_client.start(bot_token))
task1 = loop.create_task(bot_interactions_client.start())

gathered = asyncio.gather(task1, task2, loop=loop)
loop.run_until_complete(gathered)