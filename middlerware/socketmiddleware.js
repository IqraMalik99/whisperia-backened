import { User } from "../schema/user.schema.js";
import jwt from 'jsonwebtoken';
import { ApiError } from "../utilities/ApiError.js";

export const socketAuthentication =async(err,socket,next)=>{
   try {
     const accessToken = socket.request.cookies.accessToken;
     if (!accessToken) {
         throw new ApiError(400, "Token not found in cookies for sockets");
     }
 
     // Verify the JWT token
     const verification = jwt.verify(accessToken, 'mySecret');
     if (!verification) {
         throw new ApiError(400, "Token verification failed");
     }
 
     // Find the user based on the token payload
     const user = await User.findOne({ _id: verification._id }).select("-password -refreshToken");
     if (!user) {
         throw new ApiError(400, "User not found in the database");    
     }
   socket.user=user;
   console.log("socket authorized",user)
   next();
 
   } catch (error) {
      console.log("error",error.message); 
    next(new ApiError(400,`Error in socket Authentication :${error}`))
   }

}
