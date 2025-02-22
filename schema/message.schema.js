import mongoose, { Schema } from "mongoose";

export const  message = Schema({
content:{
    type:String,
},
attachment:[
    {
        public_id : String,
        url:String
    }
],
sender:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
},
chatId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Chat",
    required:true
}
,
read:{
    type:Boolean,
    default:false
}
},{timestamps: true}) ;
export const Message = mongoose.model("Message",message) 