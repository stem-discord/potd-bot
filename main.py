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

def getFields(formType):
    if formType == "mcq":
        return ([
            interactions.TextInput(
                style=interactions.TextStyleType.PARAGRAPH,
                label="Please input the puzzle:",
                custom_id="puzzle",
                placeholder="No images, surround LaTeX with $$",
                required=True,
            ),
            interactions.TextInput(
                style=interactions.TextStyleType.PARAGRAPH,
                label="Image URLs, separate with a comma",
                custom_id="images",
                placeholder="https://media.discordapp.net/attachments/",
                required=False,
            ),
            interactions.TextInput(
                style=interactions.TextStyleType.PARAGRAPH,
                label="Possible answers, separate with a \"|\"",
                custom_id="answers",
                placeholder="For example this field should be: \"Yes | No\" for a yes/no question.",
                required=True,
            ),
            interactions.TextInput(
                style=interactions.TextStyleType.PARAGRAPH,
                label="True answer indexes, separate with a comma",
                custom_id="answerKey",
                placeholder="If thr 2nd and 3rd answer inputed above are correct, input 2, 3",
                required=True,
            ),
            interactions.TextInput(
                style=interactions.TextStyleType.PARAGRAPH,
                label="Please input the hint if you have one.",
                custom_id="hint",
                placeholder="No images, surround LaTeX with $$",
                required=False,
            ),
        ])

#constants
database_path="./resources/puzzleDB.json"
bot_version="0.0.1"

bot_id=int(os.getenv("BOT_ID"))
bot_token = os.getenv("DISCORD_BOT_TOKEN")
stem_server_id=int(os.getenv("STEM_SERVER_ID"))
update_channel_id=int(os.getenv("BOT_UPDATE_CHANNEL"))

database = readDB(database_path)

#clients
bot_interactions_client = interactions.Client(token=bot_token)
bot_discord_client = discord.Client()


#events
@bot_discord_client.event
async def on_ready():
    await bot_discord_client.change_presence(activity=discord.Game(name="with question marks"))

    await bot_discord_client.get_channel(update_channel_id).send("I'm online!")
    print(f"I'm online as @{bot_discord_client.get_user(bot_id)}\nDiscord API version: {discord.__version__}\nBot version: {bot_version}")

@bot_interactions_client.command(
    name="create_multiple_choice_question",
    description="Submit a multiple choice question, this will be reviewed by managemnet and then posted as a POTD",
    scope=stem_server_id,
)
async def create_multiple_choice_question(ctx: interactions.CommandContext):
    modal = interactions.Modal(
        title="Puzzle Form",
        custom_id="mcq_form",
        components=getFields("mcq")
    )
    await ctx.popup(modal)

@bot_interactions_client.modal("mcq_form")
async def modal_response(ctx, puzzle:str, images:str, possible_answers:str, answer_key:str, hint:str):
    if "$$" in puzzle:
        pass #need to write a function to handle latex 
    splitAnswers = possible_answers.split(" | ")
    splitIndexes = answer_key.split(", ")
    splitImages = images.split(", ")

    jsonObj = {
        "metadata": {
            "createdTimestamp": 0,
            "editedTimestamp": 0,
            "allContributers": [
                0
            ],
            "creditContirbuters": [
                0
            ],
            "puzzleType": "mcq",
            "subject": "",
            "uuid": 0
        },
        "content": {
            "puzzle": puzzle,
            "answers": splitAnswers,
            "answerKey": splitIndexes,
            "hint": hint,
            "images": splitImages
        }
    }
    database.update({"unauthPuzzles": []})
    database["unauthPuzzles"].append(jsonObj)
    updateDB(database, database_path)
    await ctx.send("Submitted, thanks!", ephemeral=True)

loop = asyncio.get_event_loop()

task2 = loop.create_task(bot_discord_client.start(bot_token))
task1 = loop.create_task(bot_interactions_client.start())

gathered = asyncio.gather(task1, task2, loop=loop)
loop.run_until_complete(gathered)