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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = void 0;
const user_1 = require("../modals/user");
function seed() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield user_1.User.deleteMany({});
            const user = new user_1.User({
                email: 'shahzebakhtar66@gmail.com',
                fcmToken: 'sample_fcm_token_123',
                country: 'India',
                purchasedPacks: [
                    {
                        id: 'premium-1',
                        dailyMoodLevel: 'happy',
                        notificationTopic: 'wellness',
                        notificationMood: 'positive',
                    },
                    {
                        id: 'premium-2',
                        dailyMoodLevel: 'neutral',
                        notificationTopic: 'focus',
                        notificationMood: 'motivated',
                    },
                ],
            });
            const user2 = new user_1.User({
                email: 'drove@gmail.com',
                fcmToken: 'drove_token_123',
                country: 'India',
                purchasedPacks: [
                    {
                        id: 'premium-1',
                        dailyMoodLevel: 'Neutral',
                        notificationTopic: 'Feel-good',
                        notificationMood: 'positive',
                    }
                ],
            });
            yield user.save();
            yield user2.save();
            console.log('User seeded successfully!');
        }
        catch (err) {
            console.error('Seeding error:', err);
        }
    });
}
exports.seed = seed;
