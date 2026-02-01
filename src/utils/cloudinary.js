import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";



cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadToCloudinary = async (localFilePath)=>{

    try {
        if(!localFilePath) return null;
       
        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
       
        // file is uploaded successfully
        // Optionally, you can delete the local file after upload
       
        return result;
    } catch (error) {
        fs.unlinkSync(localFilePath); // Delete the local file in case of an error

        return null;
        
    }
}

export  { uploadToCloudinary};