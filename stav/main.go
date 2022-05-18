package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
	"time"

	discord "github.com/bwmarrin/discordgo"
	godotenv "github.com/joho/godotenv"
	"gopkg.in/robfig/cron.v2"
)

var (
	activePuzzle puzzle
	index        int
)

var (
	token string

	potdChannelID    string
	potdRoleID       string
	botID            string
	guildID          string
	potdWinnerRoleID string
)

var acceptingAnswers bool = true
var hasWinnerRole []string

func main() {
	// check we're in the right cwd
	path, _ := os.Getwd()
	if path[len(path)-8:] != "potd-bot" {
		fmt.Println("Error, please run in /potd-bot")
		os.Exit(1)
	}
	// get all .env vars
	getEnv()

	fmt.Println("Starting up...")

	// Creating a new bot session
	stavBot, err := discord.New("Bot " + token)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
	// Activating the bot
	if err = stavBot.Open(); err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
	defer stavBot.Close()
	// Add a handler for incoming messages
	stavBot.AddHandler(onNewMessage)

	stavBotUser, _ := stavBot.User("@me")

	fmt.Println("Bot is running: @" + stavBotUser.Username + "#" + stavBotUser.Discriminator)

	// update global vars
	activePuzzle, index = refreshActivePuzzle()

	// The following will send a POTD, POTD winners and update current active puzzle at specified times
	potdCron := cron.New()
	potdCron.AddFunc("@every 00h00m25s", func() { sendWinners(stavBot) })
	potdCron.AddFunc("@every 00h00m45s", func() { sendNewPOTD(stavBot); refreshActivePuzzle() })
	//newCron.AddFunc("CRON_TZ=GMT 30 06 * * *", func() { stavBot.SendNewPOTD(stavBot.Session, &newQuestion); FetchPOTD() }) // Will send a POTD at 06:30 AM GMT
	potdCron.Start()

	// Makes the program run asyncly
	<-make(chan struct{})

}

func sendNewPOTD(stavBot *discord.Session) {
	fmt.Println("Sending POTD...")

	pingMessage := "<@&" + potdRoleID + ">, New puzzle for you to solve!\n"

	var fields []*discord.MessageEmbedField
	fields = append(fields, &discord.MessageEmbedField{
		Name:   "PUZZLE:",
		Value:  activePuzzle.Content.Puzzle,
		Inline: true,
	})

	for key, image := range activePuzzle.Content.Images {
		fields = append(fields, &discord.MessageEmbedField{
			Name:   "Image " + fmt.Sprint(key+1) + ":",
			Value:  image,
			Inline: false,
		})
	}

	answers := ""
	for k, v := range activePuzzle.Content.Answers {
		answers += fmt.Sprint(k+1) + ") " + v + "\n"
	}

	var instruction string
	if activePuzzle.Metadata.PuzzleType == "mcq" {
		fields = append(fields, &discord.MessageEmbedField{
			Name:   "POSSIBLE ANSWERS:",
			Value:  answers,
			Inline: true,
		})
		instruction = "DM me the number of the answer you think is most correct!"
	} else {
		instruction = "DM me the answer!"
	}

	fields = append(fields, &discord.MessageEmbedField{
		Name:   "HINT:",
		Value:  "||" + activePuzzle.Content.Hint + "||",
		Inline: true,
	})
	fields = append(fields, &discord.MessageEmbedField{
		Name:   instruction,
		Value:  "Good luck!",
		Inline: false,
	})

	footer := "Written by: "
	for _, author := range activePuzzle.Metadata.Authors {
		user, _ := stavBot.User(fmt.Sprint(author))
		footer += user.Username + "#" + user.Discriminator + ", "
	}

	footer = footer[:len(footer)-2]

	footer += "  |  POTD #" + fmt.Sprint(index+1) + ", " + time.Now().Format("02 Jan 2006") // maps to current date, go is stupid

	var embed []*discord.MessageEmbed
	embed = append(embed, &discord.MessageEmbed{
		Type:  discord.EmbedType("rich"),
		Title: "STEM Server Puzzle Of The Day",
		Color: 0x3b7099,
		Footer: &discord.MessageEmbedFooter{
			Text: footer,
		},
		Fields: fields,
	})

	_, err := stavBot.ChannelMessageSendComplex(potdChannelID, &discord.MessageSend{
		Content: pingMessage,
		Embeds:  embed,
	})
	if err != nil {
		fmt.Println(err.Error())
	}

	// Update state
	acceptingAnswers = true
}

func refreshActivePuzzle() (puzzle, int) {
	var parsedDB struct {
		CurrentPuzzleIndex int `json:"currentPuzzleIndex"`
		PuzzleArchive      []struct {
			Metadata struct {
				CreatedTimestamp int      `json:"createdTimestamp"`
				EditedTimestamp  int      `json:"EditedTimestamp"`
				Contributers     []int64  `json:"contributers"`
				Authors          []int64  `json:"authorID"`
				PuzzleType       string   `json:"puzzleType"`
				Subject          string   `json:"subject"`
				UUID             int      `json:"uuid"`
				Tags             []string `json:"tags"`
			} `json:"metadata"`
			Content struct {
				Puzzle    string   `json:"puzzle"`
				Answers   []string `json:"answers"`
				AnswerKey []string `json:"answerKey"`
				Regex     string   `json:"regex"`
				Hint      string   `json:"hint"`
				Images    []string `json:"images"`
			} `json:"content"`
		} `json:"puzzleArchive"`
	}

	// Read the DB
	rawDatabase, err := ioutil.ReadFile("./resources/puzzleDB.json")
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	// Parse the DB into parsedPuzzleDatabase
	err = json.Unmarshal(rawDatabase, &parsedDB)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	// Reset all stats
	err = ioutil.WriteFile("./resources/currentPuzzleStats.json", []byte("{\n    \"answeredUsers\": [],\n    \"correctUsers\": []\n}"), 0644)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	// Add 1 to the current puzzle index so that next time this function is called we will return the next puzzle
	parsedDB.CurrentPuzzleIndex++
	rawDatabase, err = json.MarshalIndent(parsedDB, "", "    ")
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}

	err = ioutil.WriteFile("./resources/puzzleDB.json", rawDatabase, 0644)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
	parsedDB.CurrentPuzzleIndex--

	return parsedDB.PuzzleArchive[parsedDB.CurrentPuzzleIndex], parsedDB.CurrentPuzzleIndex
}

func sendWinners(stavBot *discord.Session) {
	// Update state
	acceptingAnswers = false

	// Removes all the roles from the past puzzle winners
	for k, userID := range hasWinnerRole {
		stavBot.GuildMemberRoleRemove(guildID, userID, potdWinnerRoleID)
		hasWinnerRole[k] = ""
	}

	// Read up stats
	var parsedPuzzleStats struct {
		AnsweredUsers []string `json:"answeredUsers"`
		CorrectUsers  []string `json:"correctUsers"`
	}

	rawPuzzleStats, err := ioutil.ReadFile("./resources/currentPuzzleStats.json")
	if err != nil {
		println(err.Error())
		return
	}

	err = json.Unmarshal(rawPuzzleStats, &parsedPuzzleStats)
	if err != nil {
		println(err.Error())
		return
	}

	// Create the message to be sent
	var message string
	message = "<@&" + potdRoleID + "> Your time is up! The answers for the last POTD are:\n"
	if activePuzzle.Metadata.PuzzleType == "mcq" {
		message += "```"
		for _, answer := range activePuzzle.Content.AnswerKey {
			i, _ := strconv.Atoi(answer)
			message += answer + ") " + activePuzzle.Content.Answers[i-1] + "\n"
		}
		message += "```"
	} else {
		message += "`"
		for _, answer := range activePuzzle.Content.AnswerKey {
			message += answer + ", "
		}
		message = message[:len(message)-2]
		message += "`"
	}

	if len(parsedPuzzleStats.CorrectUsers) >= 1 {

		message += "The following user(s) got the right answer, and they will be reciving the <@&" + potdWinnerRoleID + "> role:\n"

		for _, userID := range parsedPuzzleStats.CorrectUsers {
			message += "<@" + userID + ">, "
			err = stavBot.GuildMemberRoleAdd(guildID, userID, potdWinnerRoleID)
			if err != nil {
				fmt.Println(err.Error())
			}
			hasWinnerRole = append(hasWinnerRole, userID)
		}
		message = message[:len(message)-2]
	} else {
		message += "Sadly, no one got today's puzzle, better luck next time!"
	}

	message += "\nA new POTD will be posted shortly!"

	_, err = stavBot.ChannelMessageSend(potdChannelID, message)

	if err != nil {
		fmt.Println(err.Error())
	}
}

func onNewMessage(stavBot *discord.Session, message *discord.MessageCreate) {
	channel, _ := stavBot.Channel(message.ChannelID)
	if message.Author.ID == botID {
		return
	}

	if channel.Type == 1 {
		// Is DM
		if string(message.Content[0]) != "^" {
			// Is DM to answer puzzle
			if acceptingAnswers {
				onNewAnswer(stavBot, message)
				return
			} else {
				stavBot.ChannelMessageSend(message.ChannelID, "Sorry, there is no active puzzle at the moment, please wait for a new question.")
				return
			}
		} //else {
		// Is DM to add question
		//onPostNewPuzzle(stavBot, message)
		//}
	} //else {
	// Isnt DM
	//}

	//if channel.Type == 1 && string(message.Content[0]) != "^" {

	//}
}

func onNewAnswer(stavBot *discord.Session, message *discord.MessageCreate) {
	// read up stats
	var parsedPuzzleStats struct {
		AnsweredUsers []string `json:"answeredUsers"`
		CorrectUsers  []string `json:"correctUsers"`
	}

	rawPuzzleStats, err := ioutil.ReadFile("./resources/currentPuzzleStats.json")
	if err != nil {
		println(err.Error())
		return
	}

	err = json.Unmarshal(rawPuzzleStats, &parsedPuzzleStats)
	if err != nil {
		println(err.Error())
		return
	}

	channel, _ := stavBot.Channel(message.ChannelID)

	// Loop over the "answered users" object to see if someone is double answering
	for _, userID := range parsedPuzzleStats.AnsweredUsers {
		if message.Author.ID == userID {
			_, err = stavBot.ChannelMessageSend(channel.ID, "Hey! No cheating, you have already answered today, please wait for the next POTD to answer again.")
			if err != nil {
				println(err.Error())
			}
			return
		}
	}

	// Add user to stats
	parsedPuzzleStats.AnsweredUsers = append(parsedPuzzleStats.AnsweredUsers, message.Author.ID)
	for _, correct := range activePuzzle.Content.AnswerKey {
		if message.Content == correct {
			parsedPuzzleStats.CorrectUsers = append(parsedPuzzleStats.CorrectUsers, message.Author.ID)
		}
	}

	// Write to file
	rawPuzzleStats, err = json.MarshalIndent(parsedPuzzleStats, "", "    ")
	if err != nil {
		println(err.Error())
		return
	}

	err = ioutil.WriteFile("./resources/currentPuzzleStats.json", rawPuzzleStats, 0644)
	if err == nil {
		_, err = stavBot.ChannelMessageSend(channel.ID, "Your answer has been recorded! Good luck!")

		if err != nil {
			println(err.Error())
		}
	} else {
		_, err = stavBot.ChannelMessageSend(channel.ID, "ERROR, We have some kind of database error, please contact @XpioWolf#9420 and they will be on the issue right away.")

		if err != nil {
			println(err.Error())
		}
	}
}

//func onPostNewPuzzle(stav *discord.Session, message *discord.MessageCreate) {

//}

func getEnv() {
	err := godotenv.Load("./stav/.env")

	if err != nil {
		fmt.Printf("Error loading .env file: %s", err.Error())
		os.Exit(1)
	}

	token = os.Getenv("DISCORD_BOT_TOKEN")
	botID = os.Getenv("DISCORD_BOT_ID")
	guildID = os.Getenv("DISCORD_GUILD_ID")

	potdRoleID = os.Getenv("POTD_ROLE_ID")
	potdChannelID = os.Getenv("POTD_CHANNEL_ID")
	potdWinnerRoleID = os.Getenv("POTD_WINNER_ROLE_ID")
}

type puzzle struct {
	Metadata struct {
		CreatedTimestamp int      `json:"createdTimestamp"`
		EditedTimestamp  int      `json:"EditedTimestamp"`
		Contributers     []int64  `json:"contributers"`
		Authors          []int64  `json:"authorID"`
		PuzzleType       string   `json:"puzzleType"`
		Subject          string   `json:"subject"`
		UUID             int      `json:"uuid"`
		Tags             []string `json:"tags"`
	} `json:"metadata"`
	Content struct {
		Puzzle    string   `json:"puzzle"`
		Answers   []string `json:"answers"`
		AnswerKey []string `json:"answerKey"`
		Regex     string   `json:"regex"`
		Hint      string   `json:"hint"`
		Images    []string `json:"images"`
	} `json:"content"`
}
