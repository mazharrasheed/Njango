import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import { urls } from "./urls.js";
import { authenticate } from "./middlewares/Authmiddleware.js";
import { user,permissions } from "../auth/views.js";


// ✅ Load environment variables early
dotenv.config();


export function startServer() {
  const app = express();
  // const PORT = 3000;
  const PORT = process.env.PORT || 3000;
 

// ✅ Allow frontend requests
app.use(cors({
  origin: 'http://localhost:5173', // your frontend dev URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

  app.use(express.json());

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
