import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({

    username:{ 
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: { 
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password:{ 
        type: String,
        required: [true, "password is required"]
    },
    fullName:{ 
        type: String,
        required: true,
        trim: true,
    },
    avatar:{
        type: String,  // cloudinary url
    },
    coverImage:{
        type: String, // cloudinary url
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
    refreshToken: {
        type: String
    }

}, { timestamps: true})

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});



userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);    
}

userSchema.methods.generateAccesstoken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        }, 
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshtoken = function(){
     return jwt.sign(
        {
            _id: this._id,
        }, 
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema);