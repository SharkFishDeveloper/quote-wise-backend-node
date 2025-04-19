"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PurchasePackId;
(function (PurchasePackId) {
    PurchasePackId["PREMIUM_1"] = "premium-1";
    PurchasePackId["PREMIUM_2"] = "premium-2";
    PurchasePackId["PREMIUM_3"] = "premium-3";
})(PurchasePackId || (PurchasePackId = {}));
const purchasedPackSchema = new mongoose_1.Schema({
    id: {
        type: String,
        enum: Object.values(PurchasePackId),
        required: true,
    },
    dailyMoodLevel: { type: String },
    notificationTopic: { type: String },
    notificationMood: { type: String },
});
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    fcmToken: { type: String, required: true },
    country: { type: String },
    purchasedPacks: [purchasedPackSchema],
    // add user's own recommendation
    // city -> Maybe add this later
});
exports.User = mongoose_1.default.model("User", userSchema);
