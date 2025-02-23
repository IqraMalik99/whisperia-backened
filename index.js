import { app, server } from "./app.js";
import { mongoConnection } from "./db/mongoConnection.js";

const port = process.env.PORT;
app.get("/",(req,res,next)=>{
    res.send("Iqra Malik");
})

mongoConnection().then(()=>{
    server.listen(port,()=>{
        console.log(" My server is running on port 3000");
    })
}).catch((error)=>{
    console.log(`Cannot make connection  mongodb ${error}`)
    })

