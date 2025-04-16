import express from "express";
import connectDB from "./util/dbConnect";
import { User } from "./modals/user";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import Redis from "ioredis"
import { authMiddleware } from "./functions/authMiddleware";
import { seed } from "./seed-data/seed";
dotenv.config()




const client = new Redis(process.env.REDIS_URL as string);
const app = express();
app.use(express.json())
connectDB(process.env.MONGO_URL as string).then(()=>console.log("Connected to DB")).catch((e)=>console.log("Error connecting to DB",e));





//@ts-ignore
app.post("/login",async(req,res)=>{
    const {email} = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' })
    }
    try {

        const user = await User.findOneAndUpdate(
            { email },
            { $setOnInsert: { email } },
            { new: true, upsert: true } 
        )

        if (!process.env.JWT_SECRET) {
            return res.status(404).json({message:"JWT not defined"})
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '20d'    
        })

        return res.json({ token })
      } catch (error) {
        console.error('Login error:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
      }
})

//@ts-ignore
app.get("/",(req,res)=>{
    return res.json({message:"BACKEND is working for Quote_Wise"})
})
app.listen(3000,()=>console.log("Server running on Port:3000"));

// seed();
let isRunning = false;
setInterval(()=>{
    if (isRunning) return; // prevent overlapping
    isRunning = true;

    const redisOperations = async()=>{
        try {
        let last_index = await client.get("last_index_premium1");
        if(last_index === "-1" || last_index === null){
            // it means , the queue is empty so fetch new Users for the next notifications
            const premium_users = await User.find({
                "purchasedPacks.id": "premium-1"
            })
            for(let user of premium_users){
                const pack = user.purchasedPacks.find(p => p.id === "premium-1");
                console.log("user ",user)
                // call gemini api
                if (!pack) continue;
                await client.rpush("premium_1_queue",JSON.stringify({
                    fmcToken : user.fcmToken,
                    notification:{
                        dailyMoodLevel    : pack?.dailyMoodLevel,
                        notificationTopic : pack?.notificationTopic,
                        notificationMood  : pack?.notificationMood
                    }
                }))
                await client.set("last_index_premium1", user._id.toString());
            }
            await client.set("last_index_premium1", "done");

        }else if(last_index.length > 4){
            // it means this is an objectID and add users which come later in mongoDB
            const premium_users = await User.find({
                "purchasedPacks.id": "premium-1",
                _id: { $gt: last_index }
            });             
            for (let user of premium_users) {
                const pack = user.purchasedPacks.find(p => p.id === "premium-1");
                if (!pack) continue;
                
                await client.rpush("premium_1_queue", JSON.stringify({
                    fcmToken: user.fcmToken,
                    notification: {
                    dailyMoodLevel: pack.dailyMoodLevel,
                    notificationTopic: pack.notificationTopic,
                    notificationMood: pack.notificationMood
                    }
                }));
                await client.set("last_index_premium1", user._id.toString());
            }
        }
        } catch (error) {
            console.error("Error in redis operation:", error);
        } finally {
            isRunning = false;
        }
    }
    redisOperations();
},5000)

    //     if(premium_users.length === 0){
    //         await client.set("last_index_premium1", -1);
    //     }else{
    //         await client.set("last_index_premium1", 1);
    //     }