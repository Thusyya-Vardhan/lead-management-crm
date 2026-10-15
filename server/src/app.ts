import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import deletionRequestRoutes from "./routes/deletionRequestRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";

const app = express();

const configuredOrigin = process.env.CLIENT_URL?.replace(/\/$/, '');

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
            origin === 'http://localhost:5173' ||
            origin === 'http://localhost:3000' ||
            (configuredOrigin && origin === configuredOrigin) ||
            origin.endsWith('.vercel.app')
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
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
app.use('/api/leads', leadRoutes);
app.use('/api/deletion-requests', deletionRequestRoutes);
app.use('/api/employees', employeeRoutes);

app.use(errorHandler);

export default app;