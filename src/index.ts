import express from "express";
import connectDB from "./util/dbConnect";
import { User } from "./modals/user";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { authMiddleware } from "./functions/authMiddleware";
dotenv.config()



const app = express();
app.use(express.json())
connectDB(process.env.MONGO_URL as string).then((r)=>console.log("Connected to DB")).catch((e)=>console.log("Error connecting to DB",e));





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
            expiresIn: '-1s'
        })

        return res.json({ token })
      } catch (error) {
        console.error('Login error:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
      }
})

//@ts-ignore
app.get("/",(req,res)=>{
    return res.json({message:"BACKEND is working of Quote_Wise"})
})
app.listen(3000,()=>console.log("Server running on Port:3000"));