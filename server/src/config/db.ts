import mongoose from "mongoose";

export const connectDb = async () : Promise<void> => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini_crm';
    
    try{
        mongoose.connection.on("connected", () => {
            console.log("MongoDB Connected Sucessfully");
        });

        mongoose.connection.on("error", (error) => {
            console.error("MongoDB connection error:",error.message);   
        });

        mongoose.connection.on("disconnected",() => {
            console.warn("MongoDB disconnected");
        });

        await mongoose.connect(mongoURI);
    } catch (error) {
        console.error("Error connecting to MongoDB:",error);
        process.exit(1);
    }
}