import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhose:5173',
    credentials: true,
}));

app.use(express.json());

app.get('/api/health',(_req,res) => {
    const dbStatus = mongoose.connection.readyState === 1? "connected" : "disconnected";
    res.status(200).json({
        status: "ok",
        db: dbStatus,
        timestamp: new Date().toISOString(),
    });
});

app.use(errorHandler);

export default app;