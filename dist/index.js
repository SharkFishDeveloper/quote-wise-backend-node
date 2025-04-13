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
const authMiddleware_1 = require("./functions/authMiddleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
(0, dbConnect_1.default)(process.env.MONGO_URL).then((r) => console.log("Connected to DB")).catch((e) => console.log("Error connecting to DB", e));
//@ts-ignore
app.post("/login", authMiddleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        const user = yield user_1.User.findOneAndUpdate({ email }, { $setOnInsert: { email } }, // only set on insert, not on update
        { new: true, upsert: true } // new: return the updated document, upsert: create if not found
        );
        if (!process.env.JWT_SECRET) {
            return res.status(404).json({ message: "JWT not defined" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '-1s'
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
    return res.json({ message: "BACKEND is working of Quote_Wise" });
});
app.listen(3000, () => console.log("Server running on Port:3000"));
