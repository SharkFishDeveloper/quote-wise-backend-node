import express from "express";
import connectDB from "./util/dbConnect";
import { User } from "./modals/user";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import cors from "cors"
import { authMiddleware } from "./functions/authMiddleware";
import { redisOperations, sendFCM } from "./functions/redisOps";
import admin from "firebase-admin";
dotenv.config()




const app = express();
app.use(express.json())
app.use(cors());
connectDB(process.env.MONGO_URL as string).then(()=>console.log("Connected to DB")).catch((e)=>console.log("Error connecting to DB",e));





//@ts-ignore
app.post("/login",async(req,res)=>{
    console.log(req.body)
    const {email,fcmToken} = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' })
    }
    if (!fcmToken) {
        return res.status(400).json({ error: 'Fcm token is required' })
    }
    try {

        const user = await User.findOneAndUpdate(
            { email },
            { $setOnInsert: { email, fcmToken } },  // Only set fcmToken if it's a new user
            { new: true, upsert: true }
          );

        if (!process.env.JWT_SECRET) {
            return res.status(404).json({message:"JWT not defined"})
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '20d'    
        })

        return res.json({ token, purchasedPacks: user.purchasedPacks || [] })
      } catch (error) {
        console.error('Login error:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
      }
})




//@ts-ignore
app.post("/buy", authMiddleware, async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Pack Id not provided" });
    }

    try {
        //@ts-ignore
        const user = await User.findById(req.userId);
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

        await user.save();
        return res.status(200).json({ message: "Successfully purchased" });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

//@ts-ignore
app.put("/update",authMiddleware,async(req,res)=>{
    try {
        const {updatedPack} = req.body;
    //@ts-ignore
    const user = await User.findById(req.userId);
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }
    const packIndex = user.purchasedPacks.findIndex(
       (pack) => pack.id === updatedPack.id
    );
    user.purchasedPacks[packIndex] = {
        ...user.purchasedPacks[packIndex],
        ...updatedPack,
    };
    
    await user.save();
    return res.status(200).json({message:"Updated successfully"})
} catch (error) {
        return res.status(400).json({message:"Try again later"})
    }
})






//@ts-ignore
app.get("/",(req,res)=>{
    return res.json({message:"BACKEND is working for Quote_Wise"})
})

try {
    const FIREBASE_KEY = JSON.parse(process.env.FIREBASE_KEY_JSON as string);
    admin.initializeApp({
        credential: admin.credential.cert(FIREBASE_KEY as admin.ServiceAccount)
    });
    console.log("DONE FIREBASE ADMIN CRED")
} catch (error) {
    console.log(error)
}

//@ts-ignore
app.get("/send/1",async(req,res)=>{
    
    try {
        await sendFCM();
        return res.json({message:"Successfully pushed notifications"});
    } catch (err) {
        console.error("Send Error:", err);
        res.status(500).json({ error: "Something went wrong." });
    }
})



let isRunning = false;
setInterval(()=>{
    console.log("Interval triggered");
    if (isRunning) return; // prevent overlapping
        isRunning = true;
    try {
        redisOperations();
    } catch (error) {
        console.log("Redis operations error->>",error)
    }finally{
        isRunning = false;
    }
},2700000) 


app.listen(3000,()=>console.log("Server running on Port:3000"));
