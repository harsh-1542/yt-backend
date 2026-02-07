import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User} from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res)=>{

    // get user data from frontend
    // validation of data - non empty, valid email, password strength
    // check if user already exists in db
    // check for avatar, and coverImage if present upload to cloudinary and get the url
    // create user object - create db entry
    // remove password and refreshToken from response
    // return response to frontend

    const {username, email, password, fullName} = req.body;

    console.log('====================================');
    console.log(username," ", email, " ", fullName," ",password);
    console.log('====================================');

    if(
        [fullName, email, username, password].some((field)=> field?.trim() === "")
    ){ 
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User Already exists with this email or username");
    }

    // multer will handle the file upload and provide the file info in req.files
    // we can then upload the file to cloudinary and get the url
    // req.files?.avatar?.[0]?.path;
    
    console.log(req.files.coverImage?.[0].path);
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required local path not found");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath)
    let coverImage;
    if(coverImageLocalPath){
     coverImage = await uploadToCloudinary(coverImageLocalPath)
    }
    if(!avatar){
        throw new ApiError(400, "Avatar file is required upload to cloudinary failed");
    }
    console.log("avatar: ", avatar);
    

    const user = await User.create({
        fullName,
        avatar: avatar.secure_url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered successfully")
    )



    

})


export { registerUser }