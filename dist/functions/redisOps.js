"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisOperations = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const user_1 = require("../modals/user");
const dotenv_1 = __importDefault(require("dotenv"));
const prompt_1 = require("../util/prompt");
dotenv_1.default.config();
const client = new ioredis_1.default(process.env.REDIS_URL);
const redisOperations = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let last_index = yield client.get("last_index_premium1");
    // if(last_index === "-1" || last_index === null){
    if (true) {
        // it means , the queue is empty so fetch new Users for the next notifications
        const premium_users = yield user_1.User.find({
            "purchasedPacks.id": "premium-1"
        });
        for (let user of premium_users) {
            const pack = user.purchasedPacks.find(p => p.id === "premium-1");
            console.log("user ", user);
            if (!pack)
                continue;
            // call gemini api
            const response = yield geminiResponse({
                dailyMoodLevel: pack === null || pack === void 0 ? void 0 : pack.dailyMoodLevel,
                notificationTopic: pack === null || pack === void 0 ? void 0 : pack.notificationTopic,
                notificationMood: pack === null || pack === void 0 ? void 0 : pack.notificationMood
            });
            console.log("RESPONSE ", JSON.stringify((_b = (_a = response.candidates[0].content) === null || _a === void 0 ? void 0 : _a.parts[0]) === null || _b === void 0 ? void 0 : _b.text));
            // await client.rpush("premium_1_queue",JSON.stringify({
            //     fmcToken : user.fcmToken,
            //     notification:{
            //         dailyMoodLevel    : pack?.dailyMoodLevel,
            //         notificationTopic : pack?.notificationTopic,
            //         notificationMood  : pack?.notificationMood
            //     }
            // }))
            // await client.set("last_index_premium1", user._id.toString());
        }
        // await client.set("last_index_premium1", "done");
    }
    // else if(last_index.length > 4){
    //     // it means this is an objectID and add users which come later in mongoDB
    //     const premium_users = await User.find({
    //         "purchasedPacks.id": "premium-1",
    //         _id: { $gt: last_index }
    //     });             
    //     for (let user of premium_users) {
    //         const pack = user.purchasedPacks.find(p => p.id === "premium-1");
    //         if (!pack) continue;
    //         await client.rpush("premium_1_queue", JSON.stringify({
    //             fcmToken: user.fcmToken,
    //             notification: {
    //             dailyMoodLevel: pack.dailyMoodLevel,
    //             notificationTopic: pack.notificationTopic,
    //             notificationMood: pack.notificationMood
    //             }
    //         }));
    //         await client.set("last_index_premium1", user._id.toString());
    //     }
    // }
});
exports.redisOperations = redisOperations;
const geminiResponse = (notification) => __awaiter(void 0, void 0, void 0, function* () {
    const resp = yield fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [{ parts: [
                        {
                            text: prompt_1.prompt
                        },
                        {
                            //@ts-ignore
                            text: `The user has a daily mood level of ${notification.dailyMoodLevel}, and they prefer notifications about ${notification.notificationTopic}. Their current mood is ${notification.notificationMood}.`
                        }
                    ] }]
        })
    });
    if (!resp.ok) {
        console.error("Failed to call Gemini API:", resp.statusText);
        return null;
    }
    else {
        const data = yield resp.json();
        return data;
    }
});
// const response = await axios.post(
//     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//     {
//       contents: [{ parts: [{ text: prompt }] }],
//     },
//     { headers: { "Content-Type": "application/json" } }
//   );
