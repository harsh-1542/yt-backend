import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User} from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { serialize } from "v8";


const generateAccessAndRefreshTokens = async(userId) =>{
    try {

        const user = await User.findById(userId);

        const accessToken = user.generateAccesstoken();
        const refreshToken = user.generateRefreshtoken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Error generating tokens");
        
    }
}

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

const loginUser = asyncHandler( async (req,res)=>{

    // req.body => data
    // username or email + password
    // find the user in db
    // check password
    // generate access token and refresh token
    // send cookies and response


    const {email,username, password} = req.body;

    if(!username && !email){
        throw new ApiError(400, "Username or email is required");
    }


    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!user){
        throw new ApiError(404, "User not found with this email or username");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,

    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
        user: loggedInUser, accessToken, refreshToken
    }, "User logged in successfully"))
})


const logoutUser = asyncHandler( async(req,res)=>{
      
User.findByIdAndUpdate(req.user._id, 
    {
         $set: {refreshToken: undefined}
    },
    {
        new: true
    }
)     
  const options = {
        httpOnly: true,
        secure: true,

    }
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"))
})


const refreshAccessToken = asyncHandler( async(req,res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is required");
    }
    try {
    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id)
        
        if(!user){
            throw new ApiError(401, "Invalid Refresh token");
        }
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Invalid Refresh token");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200,{accessToken, refreshToken: newRefreshToken},"Access token refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh token");
    
    }

})


const changeCurrentPassword = asyncHandler( async(req,res) =>{
    const {oldPassword, newPassword} = req.body;

    const  user = await User.findById( req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Old password is incorrect");

    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
})


const getCurrentUserDetails = asyncHandler(async(req,res) =>{


    return res.status(200).json(new ApiResponse(200, req.user, "User details fetched successfully"));
})


const updateUserDetails = asyncHandler(async(req,res) =>{
    const {fullName, email}= req.body;

    if(!fullName && !email){
        throw new ApiError(400, "all Fields are required");
    }

    const updatedUser = User.findByIdAndUpdate(req.user?._id,{
        $set: {
            fullName, email
        }
    },{new: true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, updatedUser, "User details updated successfully"))
})


const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath =req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading avatar ")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, 
        { $set: {avatar: avatar.url}},
        {new:true}
    ).select("-password");

    return res.status(200).json(new ApiResponse(200,user, "Avatar updated successfully"))
})


const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath =req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image ")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, 
        { $set: {coverImage: coverImage.url}},
        {new:true}
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"))

})


const getUserChannerProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "username is required");
    }


    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
                
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist");
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "User channel Fetched Successfully" ));
})


export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUserDetails,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannerProfile
 }