import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

// Routes
app.get('/api/health', (_req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    res.status(200).json({
        status: "ok",
        db: dbStatus,
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', authRoutes);

app.use(errorHandler);

export default app;