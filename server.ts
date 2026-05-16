import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./src/auth";
import users from "./src/users";
import issues from "./src/issues";
import notifications from "./src/notifications";
import "./src/jobs";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000; // ✅ Correct!

  // Trust proxy for express-rate-limit
  app.set("trust proxy", 1);

  // Middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable for Vite dev
    }),
  );
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  // Socket.io setup
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_issue", (issueId) => {
      socket.join(`issue_${issueId}`);
    });

    socket.on("join_user", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their notification room`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Attach io to request for use in controllers
  app.use((req: any, res, next) => {
    req.io = io;
    next();
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", users);
  app.use("/api/issues", issues);
  app.use("/api/notifications", notifications);

  app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Server is healthy" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
      });
    },
  );

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
