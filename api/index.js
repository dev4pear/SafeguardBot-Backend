import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import TelegramBot from "node-telegram-bot-api";
import Twitter from "twitter-v2";
import { TwitterApi } from "twitter-api-v2";
import needle from "needle";

import { User } from "../model/User.js";
import { Admin } from "../model/Admin.js";
import { createUser } from "./client.js";
import { Telegraf } from "telegraf";

dotenv.config();

// const client = new Twitter({
//   consumer_key: process.env.CONSUMER_KEY,
//   consumer_secret: process.env.CONSUMER_SECRET,
//   bearer_token: process.env.BEARER_TOKEN,
//   access_token_key: process.env.ACCESS_TOKEN,
//   access_token_secret: process.env.ACCESS_SECRET,
// });

// const endpointURL = "https://api.twitter.com/2/users/by?usernames=";

// async function getRequest() {
//   // These are the parameters for the API request
//   // specify User names to fetch, and any additional fields that are required
//   // by default, only the User ID, name and user name are returned
//   const params = {
//     usernames: "web3_or_nothing", // Edit usernames to look up
//     "user.fields": "created_at,description", // Edit optional query parameters here
//     expansions: "pinned_tweet_id",
//   };

//   // this is the HTTP header that adds bearer token authentication
//   const res = await needle("get", endpointURL, params, {
//     headers: {
//       "User-Agent": "v2UserLookupJS",
//       authorization: `Bearer ${process.env.BEARER_TOKEN}`,
//     },
//   });

//   if (res.body) {
//     console.log(res.body);
//     // return res.body;
//   } else {
//     throw new Error("Unsuccessful request");
//   }
// }

// await getRequest();

const app = express();
const port = process.env.PORT || 5000;

const token = process.env.BOT_TOKEN;
const gameToken = process.env.GAMEBOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });
const gameBot = new Telegraf(gameToken);

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

await createUser();

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

app.post("/api/verify", async (req, res) => {
  const { user: userinfo, twitter, chat_id, message_id } = req.body;
  console.log("******", userinfo);
  let user = await User.findOne({ "userinfo.id": userinfo.id });
  if (user && twitter !== "") {
    user.twitter = twitter;
    await user.save();
    return res.status(500).json({ message: "Twitter Profile has updated." });
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

// get group administrators and add those to list.
bot.getChatAdministrators(process.env.SERVER_ID).then(async (admins) => {
  const tmpData = await Admin.find();
  if (tmpData.length < admins.length) {
    admins.forEach(async (admin) => {
      if (
        !admin.user.is_bot &&
        tmpData.findIndex(
          (data) => data.userinfo.user.username === admin.user.username
        ) === -1
      ) {
        console.log("Saving admin...");
        const tmp = new Admin({ userinfo: admin });
        await tmp.save();
      }
    });
  }
});

let messages = {},
  pinnedMessages = [],
  reactions = {};

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
  } else if (msg.pinned_message) {
    pinnedMessages.push(msg.pinned_message.message_id);
    console.log("pinnedMessages: ", pinnedMessages);
  }
});

gameBot.start((ctx) => ctx.reply("Welcome!"));

gameBot.on("message_reaction", (ctx) => {
  const message_reaction = ctx.update.message_reaction;
  const id = message_reaction.message_id;
  // if (pinnedMessages.includes(id)) {
  //   reactions[message_reaction.user.id.toString()] =
  //     message_reaction.new_reaction.length;
  //   console.log(reactions);
  // }
  for (var i = 0; i < pinnedMessages.length; i++) {
    if (pinnedMessages[i] === id) {
      if (reactions[id.toString()] === undefined) {
        reactions[id.toString()] = [
          {
            user: message_reaction.user.id.toString(),
            count: message_reaction.new_reaction.length,
          },
        ];
      } else {
        if (
          reactions[id.toString()].find(
            (item) => item.user === message_reaction.user.id.toString()
          ) === undefined
        ) {
          reactions[id.toString()].push({
            user: message_reaction.user.id.toString(),
            count: message_reaction.new_reaction.length,
          });
        } else {
          reactions[id.toString()].find(
            (item) => item.user === message_reaction.user.id.toString()
          ).count = message_reaction.new_reaction.length;
        }
      }
    }
  }
});

gameBot.on("message", (ctx) => {
  const from = ctx.update.message.from;
  if (from.is_bot === true) return;
  const cnt = messages[from.id.toString()];
  if (cnt === undefined) messages[from.id.toString()] = 1;
  else messages[from.id.toString()]++;
});

gameBot.on("chat_member", (ctx) => {
  try {
    const user = ctx.update.chat_member;
    if (user.invite_link !== undefined) {
      console.log(user.invite_link.creator);
      const creator = user.invite_link.creator.id;
      const cnt = messages[creator.toString()];
      if (cnt === undefined) messages[creator.toString()] = 60;
      else messages[creator.toString()] += 60;
    }
  } catch (err) {
    console.log(err);
  }
});

gameBot.launch({
  allowedUpdates: ["chat_member", "message", "message_reaction"],
});

app.listen(port, () => console.log(`Server running on port ${port}`));

const getUserInfo = async (userId) => {
  return bot
    .getChat(userId)
    .then((userInfo) => {
      return userInfo;
    })
    .catch((error) => {
      console.error("Error:", error);
      throw error;
    });
};

const calcMessages = async () => {
  const userList = await User.find();
  for (var i = 0; i < userList.length; i++) {
    userList[i].prevPoint = userList[i].point;
    await userList[i].save();
  }
  for (var x in messages) {
    try {
      const user = await User.findOne({ "userinfo.id": parseInt(x) });
      if (user !== null) {
        user.point += messages[x];
        await user.save();
      } else {
        const info = await getUserInfo(x);
        const tmp = new User({
          userinfo: info,
          twitter: "",
          prevPoint: 0,
          point: messages[x],
        });
        await tmp.save();
      }
    } catch (err) {
      console.log(err);
    }
  }
};

const main = async () => {
  await calcMessages();

  let point = {};
  let tmp;

  for (tmp in reactions) {
    for (var i = 0; i < reactions[tmp].length; i++) {
      const user = reactions[tmp][i].user;
      if (point[user] === undefined) point[user] = reactions[tmp][i].count;
      else point[user] += reactions[tmp][i].count;
    }
  }

  for (tmp in point) {
    const user = await User.findOne({ "userinfo.id": parseInt(tmp) });
    if (user === null) {
      const info = await getUserInfo(parseInt(tmp));
      const newUser = new User({
        userinfo: info,
        twitter: "",
        prevPoint: 0,
        point: 0,
      });
      await newUser.save();
    }
  }

  let userList = await User.find();
  for (var i = 0; i < userList.length; i++)
    userList[i].point += point[userList[i].userinfo.id.toString()] * 2;

  userList.sort((a, b) => b.point - a.point);
  let msg = "🏆 Leaderboard 🏆\n\n Top 10 Users \n\n";

  (userList.length > 10 ? userList.slice(0, 10) : userList).forEach(
    (user, index) => {
      let name = user.userinfo.first_name;

      if (user.userinfo.last_name !== undefined) {
        name += " " + user.userinfo.last_name;
      }

      if (user.userinfo.username !== undefined) {
        name += ": @" + user.userinfo.username;
      }

      const pointDifference = user.point - user.prevPoint;
      const diffSign = pointDifference >= 0 ? "+" : "";

      msg += `${index + 1}. ${name}: ${
        user.point
      } points (${diffSign}${pointDifference})\n`;
    }
  );

  msg += "\n\n Most Active 10 Users for last 6 hours \n\n";

  userList.sort((a, b) => b.point - b.prevPoint - (a.point - a.prevPoint));
  (userList.length > 10 ? userList.slice(0, 10) : userList).forEach(
    (user, index) => {
      let name = user.userinfo.first_name;

      if (user.userinfo.last_name !== undefined) {
        name += " " + user.userinfo.last_name;
      }

      if (user.userinfo.username !== undefined) {
        name += ": @" + user.userinfo.username;
      }

      const pointDifference = user.point - user.prevPoint;
      const diffSign = pointDifference > 0 ? "+" : "";

      msg += `${index + 1}. ${name}: ${(user.point / 20).toFixed(
        2
      )} points (${diffSign}${(pointDifference / 20).toFixed(2)})\n`;
    }
  );
  console.log(msg);
  // bot.sendMessage(process.env.SERVER_ID, msg);
};

main();

setInterval(async () => {
  await main();

  // Sort users by current points in descending order

  messages = {};
  reactions = {};
}, 1000 * 60 * 60 * 6); // every 6 hrs...
