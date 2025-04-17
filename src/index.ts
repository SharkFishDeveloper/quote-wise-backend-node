import express from "express";
import connectDB from "./util/dbConnect";
import { User } from "./modals/user";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import cors from "cors"

import { authMiddleware } from "./functions/authMiddleware";
import { seed } from "./seed-data/seed";
import { redisOperations } from "./functions/redisOps";
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
            { $setOnInsert: { email,...(fcmToken && { fcmToken }) } },
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

app.get("/send/1",async(req,res)=>{
    try {
      
    } catch (err) {
        console.error("Send Error:", err);
        res.status(500).json({ error: "Something went wrong." });
    }
})





// seed();
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
},5000) 


app.listen(3000,()=>console.log("Server running on Port:3000"));



// run every run 30 min

    //     if(premium_users.length === 0){
    //         await client.set("last_index_premium1", -1);
    //     }else{
    //         await client.set("last_index_premium1", 1);
    //     }