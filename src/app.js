import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());
app.use(express.json({limit: '20kb'}));
app.use(express.urlencoded({ extended:true, limit: '20kb' }));
app.use(express.static("public"));
app.use(cookieParser());


// routes import and usage would go here
import userRouter from "./routes/user.routes.js";

// routes declaration

app.use("/api/v1/users", userRouter);


export {app};