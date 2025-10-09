import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import { urls } from "./urls.js";
import { authenticate } from "./middlewares/Authmiddleware.js";
import { user, permissions } from "./../apps/auth/views.js";
import { permissionRequired } from "./middlewares/permissions.js";
import { fileURLToPath } from "url";
import path from "path";
import { createRequire } from "module";
import { runQuery, runExecute } from "./orm/db.js";
import morgan from "morgan";
import settings from '../../settings.js';


// ✅ Load environment variables early
dotenv.config();

export function startServer() {
  const app = express();
  // const PORT = 3000;
  const PORT = process.env.PORT || 3000;


  // ✅ Allow frontend requests
  const allowedOrigins = settings.ALLOWED_ORIGINS || [];
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json());
  app.use(morgan("dev"));

  //  app.use((req, res, next) => {
  //   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  //   next();
  // });

  app.use(authenticate)


  app.get("/", (req, res) => {
    res.send("Njango Server Running 🚀");
    console.log("Server is running on http://localhost:" + PORT);
  });

  // GET user (protected)

  app.get("/user", authenticate, user);
  app.get("/permissions", permissions);

  // Loop through urls.js and register routes
  urls.forEach((route) => {
    app[route.method || "get"](route.path, route.view);
  });

  app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
}

// ✅ Add this at the end

startServer();
