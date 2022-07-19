# Written by: XpioWolf; July 2022; please see LICENSE

# Get ENV
# set up bot - send message in dev channel and in terminal
# set up reading and writing to DB
# set up submiting quetions
# set up sending the submits and auth by mods
import os, interactions, json, time
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

def getModalFields(formType):
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
                placeholder="If the 2nd and 3rd answer inputed above are correct, input 2, 3",
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
management_channel_id=int(os.getenv("POTD_MAN_CHANNEL_ID"))
potd_ping_role_id=int(os.getenv("POTD_PING_ROLE_ID"))
potd_manager_role_id=int(os.getenv("POTD_MANAGER_ROLE_ID"))

gitBackup = False
database = readDB(database_path)

#clients
stav = interactions.Client(token=bot_token)
#bot_discord_client = discord.Client()

#
async def postForAuth(ctx:interactions.CommandContext, potd):
    ping = f"<@&{potd_manager_role_id}> A new POTD has been submitted"

    embed = interactions.Embed(color=0x000000)
    embed.title="New POTD submission!"
    embed.description=f"Posted by <@{int(ctx.author.id)}> ID: {int(ctx.author.id)}"
    embed.add_field(name="PUZZLE:",value=potd["content"]["puzzle"],inline=True)

    answers = ""
    for i in range(len(potd["content"]["answers"])):
        answers += f"{i+1}) {potd['content']['answers'][i]}\n"
    
    embed.add_field(name="POSSIBLE ANSWERS:",value=answers,inline=True)

    if potd['content']['hint'] != "":
        embed.add_field(name="HINT:",value=f"||{potd['content']['hint']}||",inline=False)

    answerKey = "||"
    for i in range(len(potd['content']['answerKey'])):
        answerKey += f"{potd['content']['answerKey'][i]}, "
    answerKey = answerKey[:-2] + "||"
    embed.add_field(name="CORRECT ANSWER(S):",value=answerKey)

    potdID = potd["metadata"]["uuid"]

    delete_button = interactions.Button(
        style=interactions.ButtonStyle.DANGER,
        label="deleteButton",
        custom_id="deletePOTD_button_" + str(potdID)
    )

    row = interactions.ActionRow(components=[delete_button])

    _channel = await stav._http.get_channel(management_channel_id)
    channel = interactions.Channel(**_channel, _client=stav._http)

    await channel.send(ping)
    await channel.send(embeds=embed, components=row)
    await ctx.send("Submitted, thanks!", ephemeral=True)


#events
@stav.event
async def on_ready():
    presence = interactions.ClientPresence(
        activities=[
            interactions.PresenceActivity(
                name="With numbers",
                type=interactions.PresenceActivityType.GAME
            ),
        ],
        status=interactions.StatusType.ONLINE,
    )
    await stav.change_presence(presence)

    _channel = await stav._http.get_channel(update_channel_id)
    channel = interactions.Channel(**_channel, _client=stav._http)

    await channel.send("I'm online!")
    print(f"I'm online as @{stav.me.name}\nBot version: {bot_version}")

@stav.command(
    name="create_multiple_choice_question",
    description="Submit a multiple choice question, this will be reviewed by managemnet and then posted as a POTD",
    scope=stem_server_id,
)
async def create_multiple_choice_question(ctx: interactions.CommandContext):
    modal = interactions.Modal(
        title="Puzzle Form",
        custom_id="mcq_form",
        components=getModalFields("mcq")
    )
    await ctx.popup(modal)

@stav.modal("mcq_form")
async def modal_response(ctx:interactions.CommandContext, puzzle:str, images:str, possible_answers:str, answer_key:str, hint:str):
    if "$$" in puzzle:
        pass #need to write a function to handle latex 
    splitAnswers = possible_answers.split(" | ")
    splitIndexes = answer_key.split(", ")
    if images != "": splitImages =  images.split(", ") 
    else: splitImages = []
    t = int(time.time())

    jsonObj = {
        "metadata": {
            "createdTimestamp": t,
            "editedTimestamp": t,
            "allContributers": [
                int(ctx.author.id)
            ],
            "creditContirbuters": [
                int(ctx.author.id)
            ],
            "puzzleType": "mcq",
            "subject": "",
            "uuid": t
        },
        "content": {
            "puzzle": puzzle,
            "answers": splitAnswers,
            "answerKey": splitIndexes,
            "hint": hint,
            "images": splitImages
        }
    }
  
    database["unauthPuzzles"].append(jsonObj)
    database["unauthIndex"][f"{t}"] = len(database['unauthPuzzles']) - 1
    updateDB(database, database_path)
    await postForAuth(ctx,database["unauthPuzzles"][-1])
    if gitBackup:
        os.system(f"git add {database_path}")
        os.system("git commit -m \"Updated Question Database\"")
        os.system("git push")

@stav.event
async def on_component(ctx: interactions.ComponentContext):
    if "deletePOTD_button_" in ctx.data.custom_id:
        Id = int(ctx.data.custom_id[len("deletePOTD_button_"):])
        index = database["unauthIndex"][f"{Id}"]
        database["unauthPuzzles"][index]={}
        updateDB(database,database_path)
        await ctx.send("Done!")
        if gitBackup:
            os.system(f"git add {database_path}")
            os.system("git commit -m \"Updated Question Database\"")
            os.system("git push")
        

stav.start()