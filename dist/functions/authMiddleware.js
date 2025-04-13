"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
//@ts-ignore
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, process.env.JWT_SECRET);
        //@ts-ignore
        req.userId = decoded.userId;
        console.log("decoded", decoded);
        next();
    }
    catch (err) {
        //@ts-ignore
        if (err.name === 'TokenExpiredError') {
            return res.status(409).json({ error: 'Token expired, please login again' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
