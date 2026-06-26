
import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";

import { pool } from "./config/db";
import { authRoutes } from "./routes/auth.routes";
import { chatRoutes } from "./routes/chat.routes";
import { moodRoutes } from "./routes/mood.routes";

dotenv.config();

const app = Fastify({
  logger: true,
});

const start = async () => {

  try {

    // CORS
    await app.register(cors, {
      origin: ["http://localhost:5173","http://localhost:5174"],
      methods: ["GET", "POST", "PUT", "DELETE"],
    });

    // Routes
    app.register(authRoutes);
    app.register(chatRoutes);
    app.register(moodRoutes);

    // Database check
    const connection = await pool.getConnection();

    console.log("✅ Database Connected Successfully");

    connection.release();

    // Server start
    await app.listen({
      port: Number(process.env.PORT) || 3900,
    });

    console.log("✅ Server Running on http://localhost:3900");

  } catch (error) {

    console.log(error);

  }

};

start();

