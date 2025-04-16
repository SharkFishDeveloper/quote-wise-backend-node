import { User } from "../modals/user";

export async function seed() {
    try {
        await User.deleteMany({})
      const user = new User({
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
      },
    );
     const user2 = new User(
        {
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
          }
     )
      await user.save();
      await user2.save();
      console.log('User seeded successfully!');
    } catch (err) {
      console.error('Seeding error:', err);
    }
  }