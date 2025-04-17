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
exports.sendFCM = exports.redisOperations = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const user_1 = require("../modals/user");
const dotenv_1 = __importDefault(require("dotenv"));
const prompt_1 = require("../util/prompt");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
dotenv_1.default.config();
const client = new ioredis_1.default(process.env.REDIS_URL);
const redisOperations = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let last_index = yield client.get("last_index_premium1");
    if (last_index === "-1" || last_index === null) {
        // if(true){
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
            yield client.rpush("premium_1_queue", JSON.stringify({
                fmcToken: user.fcmToken,
                response
            }));
            yield client.set("last_index_premium1", user._id.toString());
        }
        yield client.set("last_index_premium1", "done");
    }
    else if (last_index.length > 4) {
        // it means this is an objectID and add users which come later in mongoDB
        const premium_users = yield user_1.User.find({
            "purchasedPacks.id": "premium-1",
            _id: { $gt: last_index }
        });
        for (let user of premium_users) {
            const pack = user.purchasedPacks.find(p => p.id === "premium-1");
            if (!pack)
                continue;
            const response = yield geminiResponse({
                dailyMoodLevel: pack === null || pack === void 0 ? void 0 : pack.dailyMoodLevel,
                notificationTopic: pack === null || pack === void 0 ? void 0 : pack.notificationTopic,
                notificationMood: pack === null || pack === void 0 ? void 0 : pack.notificationMood
            });
            yield client.rpush("premium_1_queue", JSON.stringify({
                fcmToken: user.fcmToken,
                response
            }));
            yield client.set("last_index_premium1", user._id.toString());
        }
    }
    else {
        console.log("last_index ", last_index);
    }
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
function sendFCM() {
    return __awaiter(this, void 0, void 0, function* () {
        const notificationsToSend = [];
        while (true) {
            const data = yield client.lpop("premium_1_queue");
            if (!data)
                break;
            notificationsToSend.push(JSON.parse(data));
        }
        if (notificationsToSend.length === 0) {
        }
        // Construct FCM messages
        const messages = notificationsToSend.map(({ fmcToken, response }) => ({
            token: fmcToken,
            notification: {
                title: "Daily Reminder",
                body: response
            }
        }));
        const response = yield Promise.all(messages.map(msg => firebase_admin_1.default.messaging().send({
            token: msg.token,
            notification: msg.notification
        })));
    });
}
exports.sendFCM = sendFCM;
