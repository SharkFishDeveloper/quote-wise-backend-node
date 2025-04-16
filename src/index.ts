import express from "express";
import connectDB from "./util/dbConnect";
import { User } from "./modals/user";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

import { authMiddleware } from "./functions/authMiddleware";
import { seed } from "./seed-data/seed";
import { redisOperations } from "./functions/redisOps";
dotenv.config()




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
    try {
        redisOperations();
    } catch (error) {
        console.log("Redis operations error->>",error)
    }finally{
        isRunning = false;
    }
},10000)

    //     if(premium_users.length === 0){
    //         await client.set("last_index_premium1", -1);
    //     }else{
    //         await client.set("last_index_premium1", 1);
    //     }