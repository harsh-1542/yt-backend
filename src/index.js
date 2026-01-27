import dotenv from "dotenv";

dotenv.config({path: "./.env"});

import connectDB from "./db/index.js";
import { app } from "./app.js";


const PORT = process.env.PORT || 8000;
connectDB()
.then(()=>{
    app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
    })
})
.catch((err)=>{
    console.error("Database connection error:", err);
})

/* Alternative connection method without using connectDB function
( async () =>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);


    }catch(err){
        console.error("Database connection error:", err);
    }
})*/