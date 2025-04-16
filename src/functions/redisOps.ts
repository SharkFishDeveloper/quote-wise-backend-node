import Redis from "ioredis";
import { User } from "../modals/user";
import dotenv from 'dotenv'
import { prompt } from "../util/prompt";
import admin from "firebase-admin";
dotenv.config()

const client = new Redis(process.env.REDIS_URL as string);

export const redisOperations = async()=>{
    let last_index = await client.get("last_index_premium1");
    if(last_index === "-1" || last_index === null){
    // if(true){
        // it means , the queue is empty so fetch new Users for the next notifications
        const premium_users = await User.find({
            "purchasedPacks.id": "premium-1"
        })
        for(let user of premium_users){
            const pack = user.purchasedPacks.find(p => p.id === "premium-1");
            console.log("user ",user)
            if (!pack) continue;
            // call gemini api

            const response = await geminiResponse({
                dailyMoodLevel: pack?.dailyMoodLevel,
                notificationTopic: pack?.notificationTopic,
                notificationMood: pack?.notificationMood
            });
            // console.log("RESPONSE ",JSON.stringify(response.candidates[0].content?.parts[0]?.text))

            await client.rpush("premium_1_queue",JSON.stringify({
                fmcToken : user.fcmToken,
                response
            }))
            await client.set("last_index_premium1", user._id.toString());
        }
        await client.set("last_index_premium1", "done");

    }
    else if(last_index.length > 4){
        // it means this is an objectID and add users which come later in mongoDB
        const premium_users = await User.find({
            "purchasedPacks.id": "premium-1",
            _id: { $gt: last_index }
        });             
        for (let user of premium_users) {
            const pack = user.purchasedPacks.find(p => p.id === "premium-1");
            if (!pack) continue;
            const response = await geminiResponse({
                dailyMoodLevel: pack?.dailyMoodLevel,
                notificationTopic: pack?.notificationTopic,
                notificationMood: pack?.notificationMood
            });
            await client.rpush("premium_1_queue", JSON.stringify({
                fcmToken: user.fcmToken,
                response
            }));
            await client.set("last_index_premium1", user._id.toString());
        }
    }
}

const geminiResponse = async(notification: object)=>{
    const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{  parts: [
                    {
                        text:prompt
                    },
                    {
                        //@ts-ignore
                        text: `The user has a daily mood level of ${notification.dailyMoodLevel}, and they prefer notifications about ${notification.notificationTopic}. Their current mood is ${notification.notificationMood}.`
                    }
                ] }]
            })
        }
    );
    
    if (!resp.ok) {
        console.error("Failed to call Gemini API:", resp.statusText);
        return null;
    } else {
        const data = await resp.json();
        return data;
    }
}



export async function sendFCM(){
    const notificationsToSend = [];

    while (true) {
        const data = await client.lpop("premium_1_queue");
        if (!data) break;
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
    

    const response = await Promise.all(
        messages.map(msg =>
            admin.messaging().send({
                token: msg.token,
                notification: msg.notification
            })
        )
    );

}