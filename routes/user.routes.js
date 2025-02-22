import { Router } from "express";
import { auth } from "../middlerware/auth.middleware.js";
import { upload } from "../middlerware/multer.js";
import { signIn ,signUp ,signOut, getTokenCookies, getRequestPending, getRequestacceptreject, automatedLogin } from "../controller/user.controller.js";
const userRouter = Router();
userRouter.route('/sign-in').post(signIn);
userRouter.route('/sign-out').post(auth,signOut);
userRouter.route('/sign-up').post(upload.single("avatar"),signUp);  
userRouter.route('/getToken/:Userstate.id').post(getTokenCookies);
userRouter.route('/getreq').get(auth,getRequestPending);
userRouter.route('/getreqacceptreject').get(auth,getRequestacceptreject);
userRouter.route('/automatedLogin/:id').get(auth,automatedLogin);
export {userRouter}