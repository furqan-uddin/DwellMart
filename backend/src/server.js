import "dotenv/config";
import dns from "node:dns";
import app from "./app.js";
import connectDB from "./config/db.js";
import { validateEnv } from "./config/env.js";

dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("📦 Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
