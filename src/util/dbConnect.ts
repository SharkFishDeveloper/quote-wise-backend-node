import mongoose from "mongoose";

const connectDB = async(url:string)=>{
    if(!url){
        console.log("No MongoURL found")
        throw Error();
    }
    await mongoose.connect(url);
}

export default connectDB;