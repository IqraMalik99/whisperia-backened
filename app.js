import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from "uuid";
import { Server } from 'socket.io';
import http from 'http';
import { socketAuthentication } from './middlerware/socketmiddleware.js';
import { Message } from './schema/message.schema.js';
import { CHAT_JOINED, CHAT_LEAVED,  ONLINE_USERS, START_TYPING,  NEW_MESSAGE, FRIEND_REQUEST_ALERT} from './constansts/EventName.js'
import { Chat } from './schema/chat.schema.js';
import mongoose from 'mongoose';

dotenv.config();
const corsOptions = {
    origin: 'https://whisperia-backened-production.up.railway.app',
    allowedHeaders: ["Content-Type"],
    credentials: true, // Allow credentials (cookies, headers, etc.)
};

export const app = express();
export const server = http.createServer(app);

app.use(cors(corsOptions));

export let userSocketsIds = new Map();
export let onlineUsers = new Set();
let START_TYPING_SHOW = "START_TYPING_SHOW";

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message, error: err });
});

const SECRET_KEY = "your-secure-key";
const decryptMessage = (encryptedMessage) => {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// Middleware for socket authentication


export const io = new Server(server, {
    cors: {
        origin: 'https://whisperia-backened-production.up.railway.app',
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", 'Authorization'],
        credentials: true,
    }
});

io.use((socket, next) => {
    cookieParser()(
        socket.request,
        socket.request.res,
        async (err) => await socketAuthentication(err, socket, next)
    );
    console.log("Socket authenticated successfully");
});

app.set("io", io);
io.on("connection", (socket) => {
    const user = socket.user;
    console.log("socket is :", socket.user);

    const userId = user?._id?.toString(); // Safely access userId

    if (!userId) {
        console.error("User ID not found during connection");
        socket.disconnect();
        return;
    }

    userSocketsIds.set(userId, socket.id);
    console.log("User connected:", { id: userId, socketId: socket.id });
    console.log("Current userSocketsIds map:", userSocketsIds.entries());


    // Utility Function to Map Valid Socket IDs
    const getValidSockets = (members) => {
        if (!Array.isArray(members)) {
            console.error("Invalid members data. Expected an array, got:", members);
            return [];
        }
        return members
            .map((memberId) => userSocketsIds.get(memberId?.toString())) // Safely access memberId
            .filter(Boolean); // Remove undefined or null socket IDs
    };

    // **NEW_MESSAGE Event**
    socket.on(NEW_MESSAGE, async ({ sender, content, chatId, members }) => {
        console.log("Received NEW_MESSAGE event:", { content, chatId, members });
        // receiver ids exclude sender
        let notificationMembers = members.length > 0 ? members.filter((mem) => mem.toString() != user._id.toString()) : [];
        // getting their sockets
        let recIdsExMem = getValidSockets(notificationMembers);

        if (!Array.isArray(members)) {
            console.error("Invalid member data for NEW_MESSAGE:", members);
            return;
        }
        let newMessageForRealTime = {};
        if (sender.toString() === user._id.toString()) {
            newMessageForRealTime = {
                attachment: [],
                chatId,
                content,
                sender: {
                    _id: user._id.toString(),
                    username: user.username,
                },
                createdAt: new Date().toString(),
                _id: uuidv4(),
                read: false
            };
        }
        const newMessageForDB = {
            content,
            sender: user._id,
            chatId,
            read: false
        };
        console.log("New message for real time is ,", newMessageForRealTime);

        const recipients = getValidSockets(members);
        console.log("Valid socket IDs for members:", recipients);
        console.log("recipients", recipients);

        try {
            const chat = await Chat.findOne({
                _id: chatId,
                members: { $in: [user._id] },
            });
            console.log(user,"userz");
            if (chat) {
                console.log(`User ${userId} is a member of chat ${chatId}`);
                recipients.forEach((rec) => {
                    console.log("rec :", rec);
                    try {
                        console.log("new new new:", newMessageForRealTime);
                        io.to(rec).emit(NEW_MESSAGE, { newMessageForRealTime });

                    } catch (error) {
                        console.error(`Failed to send message to socket ${rec}:`, error);
                    }
                }
                );

                try {
                    const msg = await Message.create(newMessageForDB);
                    console.log("Message created successfully:", msg);
                    recIdsExMem.forEach((rec) => {
                        console.log("recExIds", rec);

                        try {
                            io.to(rec).emit('NEW_MESSAGE_COUNT', { newMessageForRealTime })
                        } catch (error) {
                            console.error(`Failed to send notification to socket ${rec}:`, error);
                        }
                    });
                } catch (error) {
                    console.error("Error saving message:", error);
                }
            } else {
                console.log(`User ${userId} is NOT a member of chat ${chatId}`);
            }
        } catch (error) {
            console.error("Error finding chat:", error);
            throw error;
        }
    });

    // **Friend Request Event**
    socket.on("Friend_Request", async ({ sender, friends }) => {
        let send = sender;
        console.log("Friends data received:", friends);

        if (!Array.isArray(friends)) {
            console.error("Invalid friends data. Expected an array, got:", friends);
            return;
        }
        let sen = await User.findById(sender.id);
        console.log("muyy", sen);
        console.log(send, "sensen");

        try {
            // Create friend requests and wait for them to resolve
            const requests = await Promise.all(
                friends.map(async (user) => {
                    console.log("lolo", user);

                    const newRequest = await Request.create({
                        content: `${send.username} sends you a friend request `,
                        sender: sen._id,
                        receiver: user,
                    });
                    return newRequest;
                })
            );
            console.log(requests, "Mne");


            // Extract request IDs for each recipient
            const recipientIds = friends.map((friend) => friend?._id).filter(Boolean); // Ensure valid IDs
            console.log("Recipient IDs:", recipientIds);

            // Get valid socket connections
            const recipients = getValidSockets(recipientIds);

            // Emit alert with sender and request ID
            requests.forEach((request, index) => {
                const recipientSocket = recipients[index];
                if (recipientSocket) {
                    io.to(recipientSocket).emit(FRIEND_REQUEST_ALERT, {
                        sender: { _id: sen._id, username: sen.username },
                        requestId: request._id, // Send request ID with alert
                        content: request.content
                    });
                }
            });

        } catch (error) {
            console.error("Error in friend request:", error);
            throw new ApiError(500, "Error in friend request");
        }
    });



    socket.on('ACCEPT_FRIEND_REQUEST', async ({ requestId, sender, data }) => {
        try {
            console.log("Senderz:", sender);
            log("Data:", user);
            console.log("requestId", requestId);
            console.log("data", data);

            // /newSingleChat/:id
            // Ensure requestId is valid
            if (!mongoose.Types.ObjectId.isValid(requestId)) {
                throw new ApiError(404, "Invalid Request ID");
            }

            // Find and update the request status
            const updatedRequest = await Request.findByIdAndUpdate(
                requestId,
                {
                    status: "accepted",
                    content: `${user.username} has accepted your friend request`
                },
                { new: true } // Return the updated document
            );

            if (!updatedRequest) {
                throw new ApiError(404, "Request not found");
            }

            // Fetch sender details from the updated request
            const senderUser = await User.findById(updatedRequest.sender);

            if (!senderUser) {
                throw new ApiError(404, "User not found");
            }
            // create chat with sender and receiver
            let creation = await Chat.create({
                members: [senderUser._id, user._id],
                isGrouped: false,
                creator: senderUser._id,
                name: senderUser.username + " " + user.username
            });
            console.log("Chat created successfully:", creation);
            if (!creation) {
                throw new ApiError(404, "Chat not created");
            }
            // refetch chats 
            let recipientSocketsforRefetch = getValidSockets([senderUser._id.toString(), user._id.toString()]); // Get sender sockets
            console.log("Recipient sockets:", recipientSocketsforRefetch);
            recipientSocketsforRefetch.forEach((rec) => {
                io.to(rec).emit('REFETCH_CHATS',{});
            });


            // Send rejection notification
            let message = `${data.username} has accepted your friend request`;
            let recipientSockets = getValidSockets([senderUser._id.toString()]); // Get sender sockets

            console.log("Recipient sockets:", recipientSockets);

            recipientSockets.forEach((rec) => {
                io.to(rec).emit('Accept_FRIEND_Request_ALERT', { message, requestId });
            });

        } catch (error) {
            console.error("Error accepted friend request:", error);
            throw new ApiError(404, "Error in accepting request");
        }
    })

    // socket.on("Attachment", async({chatId,attachment,}))

    //     socket.on('REJECT_FRIEND_REQUEST', async ({requestId, sender}) => {
    //    console.log(":",sender,":");
    //         let arr = sender.split(" ");
    //         let recipientId = getValidSockets(arr);
    //         console.log(recipientId,"rece");
    //         if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    //             return socket.emit("error", "Invalid Request ID");
    //           }     
    //         let message = `${user.username} has reject your friend request`
    //         console.log("reciept id is ", recipientId);
    //         let Id= await Request.findByIdAndUpdate(
    //             recipientId, 
    //          {status:"rejected"},
    //             { new: true } // Return the updated document
    //           );
    //           console.log("bdx",Id);
    //         if(!Id){
    //             throw new ApiError(404,"Id of req not found");
    //         }

    //       console.log("bdx",Id);

    //         recipientId.map((rec) => io.to(rec).emit('Reject_FRIEND_Request_ALERT', { message }));
    //     })

    socket.on('REJECT_FRIEND_REQUEST', async ({ requestId, sender, data }) => {
        try {
            console.log("Sender:", sender);

            // Ensure requestId is valid
            if (!mongoose.Types.ObjectId.isValid(requestId)) {
                throw new ApiError(404, "Invalid Request ID");
            }

            // Find and update the request status
            const updatedRequest = await Request.findByIdAndUpdate(
                requestId,
                {
                    status: "rejected",
                    content: `${user.username} has rejected your friend request`
                },
                { new: true } // Return the updated document
            );

            if (!updatedRequest) {
                throw new ApiError(404, "Request not found");
            }

            // Fetch sender details from the updated request
            const senderUser = await User.findById(updatedRequest.sender);

            if (!senderUser) {
                throw new ApiError(404, "User not found");
            }

            // Send rejection notification
            let message = `${data.username} has rejected your friend request`;
            let recipientSockets = getValidSockets([senderUser._id.toString()]); // Get sender sockets

            console.log("Recipient sockets:", recipientSockets);

            recipientSockets.forEach((rec) => {
                io.to(rec).emit('Reject_FRIEND_Request_ALERT', { message, requestId });
            });

        } catch (error) {
            console.error("Error rejecting friend request:", error);
            socket.emit("error", "Internal server error");
        }
    });

    socket.on('Delete_Request', async ({ id }) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ApiError(404, "Invalid Request ID");
            }
            let delReq = await Request.findByIdAndDelete(id);
            if (!delReq) {
                throw new ApiError(404, "cannot delete");
            }
            console.log("sucesssfully delete", delReq);
        } catch (error) {
            throw new ApiError(404, "cannot delete this", error);
        }

    })
    // **Typing Events**
    socket.on(START_TYPING, async ({ chatId, userId }) => {
        let chatData = await Chat.findById(chatId);
        let member = chatData.members.length >= 0 ? chatData.members.filter((mem) => mem.toString() != userId.toString()) : [];
        const recipients = getValidSockets(member);
        let username = user.username;
        recipients.forEach((rec) => socket.to(rec).emit(START_TYPING_SHOW, { chatId, username }))

    });

    // socket.on(STOP_TYPING, ({ chatId, member }) => {
    //     const recipients = getValidSockets(member);
    //     socket.to(recipients).emit(STOP_TYPING, { chatId, username: user.username });
    // });

    // **Chat Events**
    socket.on(CHAT_JOINED, ({ member }) => {
        const recipients = getValidSockets(member);
        onlineUsers.add(userId);
        io.to(recipients).emit(ONLINE_USERS, Array.from(onlineUsers));
    });

    socket.on(CHAT_LEAVED, ({ member }) => {
        const recipients = getValidSockets(member);
        onlineUsers.delete(userId);
        io.to(recipients).emit(ONLINE_USERS, Array.from(onlineUsers));
    });

    // **Handle Disconnection**
    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
        console.log("Updated userSocketsIds map:", userSocketsIds);
        console.log("Updated onlineUsers set:", onlineUsers);

        userSocketsIds.delete(userId);
        onlineUsers.delete(userId);

        console.log("Updated userSocketsIds map:", userSocketsIds);
        console.log("Updated onlineUsers set:", onlineUsers);

        // socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));  use after done with messages
    });
});

import { userRouter } from './routes/user.routes.js';
import { chatRouter } from './routes/chat.route.js';
import { Request } from './schema/request.schema.js';
import { ApiError } from './utilities/ApiError.js';
import { User } from './schema/user.schema.js';
import { log } from 'console';




app.use("/user", userRouter);
app.use("/chat", chatRouter);
