import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError.js';

cloudinary.config({ 
    cloud_name: 'da3kjrjip', 
    api_key: '515872288397519', 
    api_secret: '068Il2Zn6uqPiFKv81UJyKzwSNQ' // Click 'View API Keys' above to copy your API secret
});
  
export const deleteCloudinary = async (ids) => {
    try {
        const deletePromises = ids.map(id => 
            cloudinary.uploader.destroy(id)
        );

        // Wait for all delete operations to complete
        const results = await Promise.all(deletePromises);

        // Log the results
        results.forEach((result, index) => {
            if (result.result === "ok") {
                console.log(`Image with ID ${ids[index]} deleted successfully:`, result);
            } else {
                console.error(`Error deleting image with ID ${ids[index]}:`, result);
            }
        });

        return results; // Return the results if needed

    } catch (error) {
        throw new ApiError(400, "Error in deleting assets from Cloudinary", error);
    }
};
