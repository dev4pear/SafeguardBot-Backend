require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 5000;

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

mongoose.connect(process.env.MONGODB_URI, {
  dbName: "LandWu",
});
const database = mongoose.connection;

database.on("error", (error) => {
  console.log(error);
});

database.once("connected", () => {
  console.log("Database Connected");
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(cors());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const User = require("../model/User");

app.post("/api/verify", async (req, res) => {
  const { user: userinfo, twitter, chat_id, message_id } = req.body;
  let user = await User.findOne({ userinfo });
  console.log("***", userinfo, twitter);
  if (user) {
    console.log("This Telegram user is already registered");
    return res
      .status(500)
      .json({ message: "Telegram User already registered" });
  }
  if (twitter !== "") {
    user = await User.findOne({ twitter });
    if (user) {
      console.log("This Twitter user is already registered");
      return res
        .status(500)
        .json({ message: "Twitter User already registered" });
    }
  }
  const newUser = new User({ userinfo, twitter });
  await newUser.save();
  const tmp = await bot.createChatInviteLink(process.env.SERVER_ID, {
    expire_date: new Date().getTime() + 12000, // revoke expiration after 2 mins
  });

  bot.deleteMessage(chat_id, parseInt(message_id) + 1);
  bot.sendVideo(userinfo.id, "./portal.mp4", {
    caption: `Verified, you can join the group using this temporary link: \n\n ${tmp.invite_link}\n\nThis link is a one time use and will expire`,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Support",
            url: "https://t.me/tj0xdev",
          },
        ],
      ],
    },
  });

  res.send({ message: "Success", link: tmp });
});

bot.on("message", async (msg) => {
  if (msg.chat.type === "private" && msg.text == "/start") {
    const tmp = await bot.sendVideo(msg.chat.id, "./portal.mp4", {
      caption: `Verify you're human with Safeguard Portal \n\n Click 'VERIFY' and complete captcha to gain entry`,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "VERIFY",
              web_app: {
                url: `https://safeguard-bot.vercel.app/?message_id=${msg.message_id}&chat_id=${msg.chat.id}`,
              },
            },
          ],
        ],
      },
    });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
