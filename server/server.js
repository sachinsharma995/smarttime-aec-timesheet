import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import timesheetRoutes from "./routes/timesheetRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const clientUrls = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || clientUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/timesheets", timesheetRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SmartTime API is running",
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  const statusCode =
    error.statusCode || (error.type === "entity.parse.failed" ? 400 : 500);
  const message =
    statusCode === 400
      ? "Invalid request"
      : process.env.NODE_ENV === "production"
        ? "Something went wrong. Please try again."
        : error.message || "Something went wrong. Please try again.";

  res.status(statusCode).json({ success: false, message });
});

const startServer = async () => {
  await connectDB();

  app.listen(port, "0.0.0.0", () => {
    console.log(`SmartTime server listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
