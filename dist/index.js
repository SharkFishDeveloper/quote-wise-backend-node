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
const express_1 = __importDefault(require("express"));
const dbConnect_1 = __importDefault(require("./util/dbConnect"));
const user_1 = require("./modals/user");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const ioredis_1 = __importDefault(require("ioredis"));
dotenv_1.default.config();
const client = new ioredis_1.default(process.env.REDIS_URL);
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, dbConnect_1.default)(process.env.MONGO_URL).then(() => console.log("Connected to DB")).catch((e) => console.log("Error connecting to DB", e));
//@ts-ignore
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        const user = yield user_1.User.findOneAndUpdate({ email }, { $setOnInsert: { email } }, { new: true, upsert: true });
        if (!process.env.JWT_SECRET) {
            return res.status(404).json({ message: "JWT not defined" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '20d'
        });
        return res.json({ token });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}));
//@ts-ignore
app.get("/", (req, res) => {
    return res.json({ message: "BACKEND is working for Quote_Wise" });
});
app.listen(3000, () => console.log("Server running on Port:3000"));
// seed();
setInterval(() => {
    const redisOperations = () => __awaiter(void 0, void 0, void 0, function* () {
        let last_index = yield client.get("last_index_premium1");
        console.log("last_index ", last_index);
        return;
        // if(last_index === null){
        const premium_users = yield user_1.User.find({
            "purchasedPacks.id": "premium-1"
        });
        for (let user of premium_users) {
            const pack = user.purchasedPacks.find(p => p.id === "premium-1");
            console.log("user ", user);
            // call gemini api
            if (!pack)
                continue;
            yield client.rpush("premium_1_queue", JSON.stringify({
                fmcToken: user.fcmToken,
                notification: {
                    dailyMoodLevel: pack === null || pack === void 0 ? void 0 : pack.dailyMoodLevel,
                    notificationTopic: pack === null || pack === void 0 ? void 0 : pack.notificationTopic,
                    notificationMood: pack === null || pack === void 0 ? void 0 : pack.notificationMood
                }
            }));
        }
        //     if(premium_users.length === 0){
        //         await client.set("last_index_premium1", -1);
        //     }else{
        //         await client.set("last_index_premium1", 1);
        //     }
        // }
    });
    redisOperations();
}, 5000); //24 min day
