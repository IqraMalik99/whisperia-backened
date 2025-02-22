import { Router } from "express";
import { auth } from "../middlerware/auth.middleware.js";
import {getmembersfromchatId, addmember, chatFriend, createMessage, getChats, getFriends, getGroups, getMessages, leaveGroup, newGroup, notMyFriend, removeMember, sendAttachments, newChat, deleteChat, ChatBot, getChatInfo } from "../controller/chat.controller.js";
import { newGroupValidator } from "../utilities/validator.js";
import { upload } from "../middlerware/multer.js";
import { chat } from "../schema/chat.schema.js";

const chatRouter = Router();

chatRouter.route('/new').post(auth,newGroupValidator(),newGroup)
chatRouter.route('/get-chat').get(auth,getChats)
chatRouter.route('/create-chat').post(auth,createMessage)        // create message
chatRouter.route('/get-group').get(auth,getGroups)
chatRouter.route('/addmember').post(auth,addmember)
chatRouter.route('/left/:id').post(leaveGroup)
chatRouter.route('/getmsg/:id').get(getMessages)  // get messages
// chatRouter.route('/sendAttachment').post(auth,upload.array("attachment",5),sendAttachments);
chatRouter.route('/getFriends').get(auth,getFriends);
chatRouter.route('/friendchat/:id').get(auth,chatFriend);
chatRouter.route('/getNotMyFriend').get(auth,notMyFriend);
chatRouter.route('/getmemberfromchatId/:id').get(auth,getmembersfromchatId)
chatRouter.route('/newSingleChat/:id').get(auth,newChat);
chatRouter.route('/delete-chat/:id').get(auth,deleteChat);
chatRouter.route('/createAttachment').post(auth, upload.array("attachment",10),createMessage);
chatRouter.route('/left-chat/:id').get(auth,leaveGroup);
chatRouter.route('/get-info/:id').get(auth,getChatInfo)
chatRouter.route('/remove/:chatId/:member').get(auth,removeMember)
export {chatRouter}