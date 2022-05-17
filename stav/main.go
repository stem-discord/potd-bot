package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"time"

	discord "github.com/bwmarrin/discordgo"
	"gopkg.in/robfig/cron.v2"
)

var (
	activePuzzle puzzle
	index        int
)

func main() {
	println("Starting up...")

	//---------set up discord API

	// Creating a new bot session
	stavBot, err := discord.New("Bot " + token)
	if err != nil {
		log.Fatal(err.Error())
		return
	}

	// Activating the bot
	if err = stavBot.Open(); err != nil {
		log.Fatal(err.Error())
		return
	}
	defer stavBot.Close()
	stavBot.AddHandler(onNewMessage)
	println("Bot is running!")

	// update global vars
	activePuzzle, index = refreshActivePuzzle()

	// The following will send a POTD, POTD winners and update current active puzzle at specified times
	potdCron := cron.New()
	potdCron.AddFunc("@every 00h00m45s", func() { sendNewPOTD(stavBot); refreshActivePuzzle() })
	//newCron.AddFunc("CRON_TZ=GMT 30 06 * * *", func() { stavBot.SendNewPOTD(stavBot.Session, &newQuestion); FetchPOTD() }) // Will send a POTD at 06:30 AM GMT
	potdCron.Start()

	// Makes the program run async
	<-make(chan struct{})

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
	rawDatabase, err := ioutil.ReadFile("../puzzleDB.json")
	if err != nil {
		log.Fatal(err.Error())
		return parsedDB.PuzzleArchive[parsedDB.CurrentPuzzleIndex], parsedDB.CurrentPuzzleIndex
	}

	// Parse the DB into parsedPuzzleDatabase
	err = json.Unmarshal(rawDatabase, &parsedDB)
	if err != nil {
		log.Fatal(err.Error())
		return parsedDB.PuzzleArchive[parsedDB.CurrentPuzzleIndex], parsedDB.CurrentPuzzleIndex
	}

	// Reset all stats
	err = ioutil.WriteFile("../currentPuzzleStats.json", []byte("{\n    \"answeredUsers\": [],\n    \"correctUsers\": []\n}"), 0644)
	if err != nil {
		log.Fatal(err.Error())
		return parsedDB.PuzzleArchive[parsedDB.CurrentPuzzleIndex], parsedDB.CurrentPuzzleIndex
	}

	return parsedDB.PuzzleArchive[parsedDB.CurrentPuzzleIndex], parsedDB.CurrentPuzzleIndex
}

func sendNewPOTD(stavBot *discord.Session) {
	println("Sending POTD...")

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

	//switch potd.Meta.PuzzleType {
	//case "mcq":
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

	//}

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
		println(err.Error())
	}
}

func onNewMessage(session *discord.Session, message *discord.MessageCreate) {
	var parsedPuzzleStats struct {
		AnsweredUsers []string `json:"answeredUsers"`
		CorrectUsers  []string `json:"correctUsers"`
	}

	channel, _ := session.Channel(message.ChannelID)
	if channel.Type != 1 || message.Author.ID == botID {
		return
	}

	rawPuzzleStats, err := ioutil.ReadFile("../currentPuzzleStats.json")
	if err != nil {
		println(err.Error())
		return
	}

	err = json.Unmarshal(rawPuzzleStats, &parsedPuzzleStats)
	if err != nil {
		println(err.Error())
		return
	}

	for _, userID := range parsedPuzzleStats.AnsweredUsers {
		if message.Author.ID == userID {
			_, err = session.ChannelMessageSend(channel.ID, "Hey! No cheating, you have already answered today, please wait for the next POTD to answer again")
			if err != nil {
				println(err.Error())
			}
			return
		}
	}

	parsedPuzzleStats.AnsweredUsers = append(parsedPuzzleStats.AnsweredUsers, message.Author.ID)
	for _, correct := range activePuzzle.Content.AnswerKey {
		if message.Content == correct {
			parsedPuzzleStats.CorrectUsers = append(parsedPuzzleStats.CorrectUsers, message.Author.ID)
		}
	}

	println("I am a bugger")

	rawPuzzleStats, err = json.MarshalIndent(parsedPuzzleStats, "", "    ")
	if err != nil {
		println(err.Error())
		return
	}

	err = ioutil.WriteFile("../currentPuzzleStats.json", rawPuzzleStats, 0644)
	if err == nil {
		_, err = session.ChannelMessageSend(channel.ID, "Your answer has been recorded! Good luck!")

		if err != nil {
			println(err.Error())
		}
	} else {
		_, err = session.ChannelMessageSend(channel.ID, "ERROR, We have some kind of database error, please contact @XpioWolf#9420 and they will be on the issue right away.")

		if err != nil {
			println(err.Error())
		}
	}
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

const (
	token         string = "OTYwNzY0ODcwNDkwNDc2NTU0.GdWa53.NBaXajnueKmQRDFBXX2U9P_M-hkOQVfGJzFdB0"
	potdChannelID string = "917043544617795667"
	potdRoleID    string = "972818493739253790"
	botID         string = "960764870490476554"
)

// What he have so far:
// Sends a new POTD every specified period
// Can recive answers and keeps track of users
// What else we need:
// Sends a congratulations for all winners and adds POTD winner role
// A system for users to add questions
// A system for modds to check these questions
// What will be added in the future:
// LaTeX support
// ...

// TESTING!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// Upload to repl.it and more TESTING!!!!!!!!!!!!!
