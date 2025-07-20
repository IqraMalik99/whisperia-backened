import mongoose from "mongoose"

let MONGODB=process.env.MONGODB;
export const mongoConnection= async()=>{
    try{
 let connect= await mongoose.connect(process.env.MONGOBD_URI);
console.log('Database connected successfully ');
// console.log(connect.connection.host);
    }
    catch(error){
        console.log(`having error in mongodb connection ${error}`)
        process.exit(1)
    }
}
