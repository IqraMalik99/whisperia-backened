import mongoose, { Schema } from "mongoose";

export const  chat = Schema({
name:{
    type:String,
    required:true
},
members:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
],
isGrouped:{
    type:Boolean,
    required:false
},
creator:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
},

},{timestamps: true}) ;
export const Chat = mongoose.model("Chat",chat)