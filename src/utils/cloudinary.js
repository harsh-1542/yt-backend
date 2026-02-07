import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";





const uploadToCloudinary = async (localFilePath)=>{
    
    try {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
        console.log("Cloudinary Key:", process.env.CLOUDINARY_API_KEY);
       
        if(!localFilePath){
            return null;
        };
       
        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
       
        console.log('====================================');
        console.log("file is uploaded successfully");
        console.log('====================================');
        // file is uploaded successfully
        // Optionally, you can delete the local file after upload
        fs.unlinkSync(localFilePath); // Delete the local file

        return result;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
 if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Delete the local file
    }
        return null;
        
    }
}

export  { uploadToCloudinary};