
import mongoose, { Schema } from "mongoose";

export const request = Schema({
content:{
    type:String,
    required:true
},
sender:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
},
receiver:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
},
status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

},{timestamps: true}) ;
export const Request = mongoose.model("Request",request)