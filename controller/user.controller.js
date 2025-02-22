import { User } from "../schema/user.schema.js";
import { ApiError } from "../utilities/ApiError.js";
import { AsyncHandler } from "../utilities/AsyncHandler.js";
import { cloudinaryUploader } from "../utilities/cloudinary.js";
import { Responce } from "../utilities/Responce.js";
import { Chat } from "../schema/chat.schema.js";
import mongoose from "mongoose";
import {getSockets} from '../utilities/Event.js'
import { Request } from "../schema/request.schema.js";

// generate access token and refresh token 
let genToken = async (id) => {
    try {
      if (!id) {
        throw new ApiError(404, "not getting id to generate token ");
      }
      let user = await User.findById(id);
      if (!user) {
        throw new ApiError(404, "not getting user from id")
      }
      let refreshToken = await user.genRefreshToken();
      console.log(typeof user.genRefreshToken); 
      let accessToken = await user.genAccessToken();
      if (!refreshToken || !accessToken) {
        throw new ApiError(404, "not gen token from methods");
      }
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false })
      return { refreshToken, accessToken }
    } catch (error) {
      throw new ApiError(404, "Error in gen tokens from method")
    }
  }
  let options = {
   path: '/', 
   httpOnly: true, 
   sameSite: 'Lax'
    // sameSite: 'None'  in deploymnet
  }
  export const signIn = AsyncHandler(async (req, res, next) => {
    try {
      let { username, email, password } = req.body
      if (!username && !email) {
        throw new ApiError(404, "please give either email or password");
      }
      if (!password) {
        throw new ApiError(404, "password is required")
      }
      let user = await User.findOne({ email: email });
      console.log(user);
      if (!user) {
        throw new ApiError(404, "Invalid email");
      }
      console.log(user);
      
      let checker = await user.checkPassword(password);
      console.log("checker",checker);
      if (!checker) {
        throw new ApiError(404, "Invalid password");
      }
      let { refreshToken, accessToken } = await genToken(user._id);
      if (!refreshToken || !accessToken) {
        throw new ApiError(404, "not getting token from function");
      }
      return res.status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new Responce(200, {
          refreshToken,
          accessToken ,
          avatar : user.avatar,
          time: user.createdAt,
          id:user._id
        }, "Sucessfully Logged in"));
    } catch (error) {
      throw new ApiError(404, "Error in logged in",error.message)
    }
  
  });
  
  export const signUp = AsyncHandler(async (req, res, next) => {
  
    let { email, password, username } = req.body;
    console.log("req.file is", req.file);
    
        let cloudinaryPath = await cloudinaryUploader(req.file?.path);
        console.log(`cloudinaryPath  is ${cloudinaryPath.url}`);
    if (!email || !password || !username) {
      throw new ApiError(404, "required all data to register")
    }
    try {
      let createUser = await User.create({
        email: email,
        password: password,
        username: username,
        avatar:cloudinaryPath.url
      });
      if (!createUser) {
        throw new ApiError(404, "User creation error")
      }
      // let { refreshToken, accessToken } = await genToken(createUser._id);
      // if (!refreshToken || !accessToken) {
      //   throw new ApiError(404, "notgetting token from function");
      // }
      // let user = await User.findById(createUser._id).select("-password  -refreshToken");
      // if (!user) {
      //   throw new ApiError(404, "Not getting user after remove password or token")
      // }
      return res.status(200).json(new Responce(200, createUser, "Sucessfully Register"))
    } catch (error) {
      throw new ApiError(404, `Having error in registeration ${error}`)
    }
  
  });
  
  export const signOut = AsyncHandler(async (req, res, next) => {
    try {
      let user = req.user;
      if (!user) {
        throw new ApiError(404, "unAuthorized in logout")
      }
      let getUser = await User.findById(user._id);
      if (!getUser) {
        throw new ApiError(404, "not getting user in logout")
      }
      getUser.refreshToken = "";
      await getUser.save({ validateBeforeSave: false });
         console.log("Sucessfully logout");

     res.status(200);
     res.clearCookie("accessToken",options);
     res.clearCookie("refreshToken",options);
     console.log("Sucessfully logout",req.cookies.accessToken);
     return  res.json(new Responce(200,null,"user is logout"));
    } catch (error) {
      console.log("error in logout");
      
      throw new ApiError(401, "error in logout")
    }
  });
 
  export let  getTokenCookies=AsyncHandler(async(req,res,next)=>{
   try {
     let id = req.params.Userstate.id;

     let user = await User.findById(id);
     console.log(user);
     if (!user) {
       throw new ApiError(404, "Invalid email");
     }
     let { refreshToken, accessToken } = await genToken(user._id);
     if (!refreshToken || !accessToken) {
       throw new ApiError(404, "notgetting token from function");
     }
     return res.status(200).cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options).json(new Responce(200, {refreshToken:refreshToken} , "Sucessfully created token"))
   } catch (error) {
    throw new ApiError(404, `Having error in genrating token ${error}`)
   }

  })

  export let getRequests =AsyncHandler(async(req,res,next)=>{
   try {
     let user = req.user;   
   if(!user){
     throw new ApiError(404,"UnAuthorized");
   }
   let reqList=[];
  if (user.request > 0){
   reqList = user.request.map(async (per) => await User.findById(per))
  }
  console.log("getter get",reqList);
  console.log("Done");
  
  return res.status(200).json(new Responce(200, reqList , "Sucessfully "))
   } catch (error) {
    throw new ApiError(404,"Not getting requests");
   }
  })

  export let updateRequest = AsyncHandler(async(req,res,next)=>{
   try {
    console.log("Entry!!!!!");
    
     let user = req.user;
     let id = req.params.reqId;
     if(!user){
       throw new ApiError(404,"UnAuthorized");
     }
    if(!id){
      throw new ApiError(404,"not having id");
    }
    console.log("Ids of updated req :", id);
    
    user.request.push(id);
    await user.save();
    return res.status(200).json(new Responce(200, user , "Sucessfully "))
   } catch (error) {
    throw new ApiError(404,`getting error in update req : ${error}`);
   }
  })
  // request
  export let getRequestPending =AsyncHandler(async(req,res,next)=>{
  try {
    console.log("kpkkpk");
    
      let user = req.user;
      let requests = await Request.find({receiver:user._id})
      .populate("receiver", "username"); 
      console.log("rere",requests);
      
      res.status(200).json(new Responce(200,requests,"sucess"))
  } catch (error) {
    throw new ApiError(404,`getting error in get req : ${error}`);
  }
  })

  export let getRequestacceptreject =AsyncHandler(async(req,res,next)=>{
    try {
        let user = req.user;
        let requests = await Request.find({sender:user._id})
        .populate("receiver", "username"); 
        console.log("rere",requests);
        
        res.status(200).json(new Responce(200,requests,"sucess"))
    } catch (error) {
      throw new ApiError(404,`getting error in get req : ${error}`);
    }
    })

    export let automatedLogin= AsyncHandler(async(req,res,next)=>{
  try {
        let id = req.params.id;
        if(!id){
          throw new ApiError(404,"Not having id");
              }
         let findUser = await User.findById(id);
         if(!findUser){
          throw new ApiError(400,"not getting user in automated login")
         }
         res.status(200).json(new Responce(200,findUser,"sucess in automated login"));
  } catch (error) {
    throw new ApiError(200,"not get automated login");
   }
    })