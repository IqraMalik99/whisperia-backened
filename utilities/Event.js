import { userSocketsIds } from "../app.js";

 export const emitEvent = (req, event, users, data) => {
    console.log(event);
  };  

export let  getSockets = (user= [] )=>{
     user.length>0 ? user.map((val)=>{
      return userSocketsIds.get(val.toString())
     }) :[];
}