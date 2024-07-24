import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import readline from "readline";

const apiId = 6435225;
const apiHash = "4e984ea35f854762dcde906dce426c2d";
const stringSession = new StringSession(
  "1BAAOMTQ5LjE1NC4xNjcuOTEAULnbgsCIyXZqmO+8/i2yQnlbxNDPvosYNnuNIKBa3DUHQiI8fRfZ9R1BkAg2/4LxN3KzuD0xTtEn1h6bI1e/89mwfLqwO2jGiJTMd64owOvcq2GPId7FghDxkYakkbUtiIiHaPnhnJJGZ20XIwicK3W4nxHjqDB7rlRWAtTgLcPUUB4a1vs51pUPWi24k5U44ncv9vXpQT8zSTIhX+7noeZVgXBAIbd/L/30wI2f+ZbQhAsq8dq1ZUVDUJVcPzQVtdNcQHfmZ0eAAkX+SmdVog7Yko5F5zwMFKxE7Zgxyu/7D7nKVcVm8oRVK3lTiEIID7GF3CArtyR2br27RnC3FrM="
); // fill this later with the value from session.save()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const createUser = async () => {
  console.log("Loading interactive example...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  //   await client.start({
  //     phoneNumber: async () =>
  //       new Promise((resolve) =>
  //         rl.question("Please enter your number: ", resolve)
  //       ),
  //     password: async () =>
  //       new Promise((resolve) =>
  //         rl.question("Please enter your password: ", resolve)
  //       ),
  //     phoneCode: async () =>
  //       new Promise((resolve) =>
  //         rl.question("Please enter the code you received: ", resolve)
  //       ),
  //     onError: (err) => console.log(err),
  //   });
  //   console.log("You should now be connected.");
  //   console.log(client.session.save()); // Save this string to avoid logging in again
  await client.start();

  const chatId = process.env.SERVER_ID; // Replace with your actual group chat's ID or username

  try {
    // Fetch the full channel (group) info
    // const result = await client.getEntity(chatId);
    // const entity = result;

    let offsetId = 0;
    const limit = 100; // Number of messages to be fetched per request
    const allMessages = [];

    // const res = await client.invoke(
    //   new Api.messages.CheckChatInvite({ hash: "eWLIakraRZ5jYWYx" })
    // );
    // console.log(res);
    // const result = await client.invoke(
    //   new Api.messages.GetAdminsWithInvites({
    //     peer: chatId,
    //   })
    // );

    let inviteCounts = {};
    // Iterate through the participants to count invites
    // console.log(res.participants);

    // for (const participant of res.participants) {
    //   if ("inviterId" in participant) {
    //     if (!inviteCounts[participant.inviterId.value]) {
    //       inviteCounts[participant.inviterId.value] = 0;
    //     }
    //     inviteCounts[participant.inviterId.value]++;
    //   }
    // }

    // console.log("Invite Counts:", inviteCounts);
    // try {
    //   // Fetch the full channel (group) info
    //   const entity = await client.getEntity(chatId);

    //   let offset = 0;
    //   const limit = 100; // Number of participants to be fetched per request
    //   const allParticipants = [];

    //   while (true) {
    //     const participants = await client.invoke(
    //       new Api.channels.GetParticipants({
    //         channel: entity,
    //         filter: new Api.ChannelParticipantsRecent({}),
    //         offset: offset,
    //         limit: limit,
    //         hash: 0,
    //       })
    //     );

    //     if (!participants.participants.length) {
    //       break;
    //     }

    //     allParticipants.push(...participants.participants);
    //     offset += participants.participants.length;
    //   }

    //   console.log(allParticipants);
    // } catch (error) {
    //   console.error("Error fetching participants:", error);
    // }
    // {
    //   const history = await client.invoke(
    //     new Api.messages.GetHistory({
    //       peer: entity,
    //       offsetId: offsetId,
    //       limit: 1,
    //     })
    //   );

    //   //   if (!history.messages.length) {
    //   //     break;
    //   //   }

    //   allMessages.push(...history.messages);
    //   offsetId = history.messages[history.messages.length - 1].id;
    // }

    // console.log(allMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
  }
};
