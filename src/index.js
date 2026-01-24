import dotenv from "dotenv";

dotenv.config();

import connectDB from "./db/index.js";

connectDB();

/* Alternative connection method without using connectDB function
( async () =>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);


    }catch(err){
        console.error("Database connection error:", err);
    }
})*/