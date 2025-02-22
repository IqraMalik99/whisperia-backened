import { User } from "../schema/user.schema.js";
import { ApiError } from "../utilities/ApiError.js";
import { AsyncHandler } from "../utilities/AsyncHandler.js";
import jwt from "jsonwebtoken";

const auth = AsyncHandler(async (req, res, next) => {
    try {
        console.log("Access Token : ",req.cookies.accessToken);
        
        // Check if the access token exists in cookies
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            throw new ApiError(400, "Token not found in cookies");
        }

        // Verify the JWT token
        let verification;
        try {
            verification = jwt.verify(accessToken, 'mySecret');
        } catch (err) {
            throw new ApiError(400, "Token verification failed");
        }

        // Find the user based on the token payload
        const user = await User.findOne({ _id: verification._id }).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(400, "User not found in the database");
        }

        // Attach the user to the request object
        req.user = user;
        next();

    } catch (error) {
        // Log the actual error message for debugging
        console.error("Auth Middleware Error:", error);

        // Throw the error with a specific message
        throw new ApiError(400, `Auth middleware error: ${error.message}`);
    }
});

export { auth };
