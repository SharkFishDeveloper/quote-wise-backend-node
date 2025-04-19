import mongoose, { Schema } from "mongoose";

enum PurchasePackId {
  PREMIUM_1 = "premium-1",
  PREMIUM_2 = "premium-2",
  PREMIUM_3 = "premium-3",
}

const purchasedPackSchema = new Schema({
  id: {
    type: String,
    enum: Object.values(PurchasePackId),
    required: true,
  },
  dailyMoodLevel: { type: String},
  notificationTopic: { type: String},
  notificationMood: { type: String},
});

const userSchema = new Schema({
  email: { type: String, required: true },
  fcmToken: { type: String,required: true },
  country: { type: String },
  purchasedPacks: [purchasedPackSchema],
  // add user's own recommendation
  // city -> Maybe add this later
});

export const User = mongoose.model("User", userSchema);
