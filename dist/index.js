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
const cors_1 = __importDefault(require("cors"));
const authMiddleware_1 = require("./functions/authMiddleware");
const redisOps_1 = require("./functions/redisOps");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
(0, dbConnect_1.default)(process.env.MONGO_URL).then(() => console.log("Connected to DB")).catch((e) => console.log("Error connecting to DB", e));
//@ts-ignore
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    const { email, fcmToken } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    if (!fcmToken) {
        return res.status(400).json({ error: 'Fcm token is required' });
    }
    try {
        const user = yield user_1.User.findOneAndUpdate({ email }, { $setOnInsert: { email, fcmToken } }, // Only set fcmToken if it's a new user
        { new: true, upsert: true });
        if (!process.env.JWT_SECRET) {
            return res.status(404).json({ message: "JWT not defined" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '20d'
        });
        return res.json({ token, purchasedPacks: user.purchasedPacks || [] });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}));
//@ts-ignore
app.post("/buy", authMiddleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: "Pack Id not provided" });
    }
    try {
        //@ts-ignore
        const user = yield user_1.User.findById(req.userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        const alreadyPurchased = user.purchasedPacks.some(pack => pack.id === id);
        if (alreadyPurchased) {
            return res.status(400).json({ message: "Pack already purchased" });
        }
        user.purchasedPacks.push({
            id,
            dailyMoodLevel: null,
            notificationTopic: null,
            notificationMood: null,
        });
        yield user.save();
        return res.status(200).json({ message: "Successfully purchased" });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}));
//@ts-ignore
app.put("/update", authMiddleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { updatedPack } = req.body;
        //@ts-ignore
        const user = yield user_1.User.findById(req.userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        const packIndex = user.purchasedPacks.findIndex((pack) => pack.id === updatedPack.id);
        user.purchasedPacks[packIndex] = Object.assign(Object.assign({}, user.purchasedPacks[packIndex]), updatedPack);
        yield user.save();
        return res.status(200).json({ message: "Updated successfully" });
    }
    catch (error) {
        return res.status(400).json({ message: "Try again later" });
    }
}));
//@ts-ignore
app.get("/", (req, res) => {
    return res.json({ message: "BACKEND is working for Quote_Wise" });
});
try {
    const FIREBASE_KEY = JSON.parse(process.env.FIREBASE_KEY_JSON);
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(FIREBASE_KEY)
    });
    console.log("DONE FIREBASE ADMIN CRED");
}
catch (error) {
    console.log(error);
}
//@ts-ignore
app.get("/send/1", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, redisOps_1.sendFCM)();
        return res.json({ message: "Successfully pushed notifications" });
    }
    catch (err) {
        console.error("Send Error:", err);
        res.status(500).json({ error: "Something went wrong." });
    }
}));
let isRunning = false;
setInterval(() => {
    console.log("Interval triggered");
    if (isRunning)
        return; // prevent overlapping
    isRunning = true;
    try {
        (0, redisOps_1.redisOperations)();
    }
    catch (error) {
        console.log("Redis operations error->>", error);
    }
    finally {
        isRunning = false;
    }
}, 2700000);
app.listen(3000, () => console.log("Server running on Port:3000"));
