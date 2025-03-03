import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
cloudinary.config({ 
  cloud_name: 'da3kjrjip', 
  api_key: '515872288397519', 
  api_secret: '068Il2Zn6uqPiFKv81UJyKzwSNQ' // Click 'View API Keys' above to copy your API secret
});


export const cloudinaryUploader = async (file) => {
  try {
    console.log("Uploading file:", file);

    // Get File Extension
    const extension = file.split('.').pop().toLowerCase();

    // Determine resource type and folder
    let options = {
      folder: extension === 'pdf' ? 'pdfs' : 'media',
      use_filename: true,
      unique_filename: false,
    };

    // Handle PDFs separately
    if (extension === 'pdf') {
      options.resource_type = "raw";
      options.format = "pdf";
      options.public_id = `pdfs/${Date.now()}`;
    } else {
      options.resource_type = "auto";
    }

    // Upload to Cloudinary
    let response = await cloudinary.uploader.upload(file, options);
    console.log(`Cloudinary Response: ${JSON.stringify(response)}`);

    // Delete Local File
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }

    return response;

  } catch (error) {
    // Delete Local File on Error
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};
