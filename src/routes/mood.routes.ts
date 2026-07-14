
import { FastifyInstance } from "fastify";
import { pool } from "../config/db";
import { authMiddleware } from "../middleware/auth.middleware";


export async function moodRoutes(app: FastifyInstance) {

  // ======================
  // SAVE MOOD
  // ======================
  app.post("/mood", { preHandler: authMiddleware }, async (req, reply) => {

    try {

      const { mood } = req.body as any;

      if (!mood) {
        return reply.status(400).send({
          message: "Mood is required"
        });
      }

      const userId = (req as any).user.id;

      await pool.query(
        "INSERT INTO moods (user_id, mood) VALUES (?, ?)",
        [userId, mood]
      );

      return reply.send({
        message: "Mood saved"
      });

    } catch (error) {
      console.log("SAVE MOOD ERROR:", error);

      return reply.status(500).send({
        error: "Something went wrong"
      });
    }
  });


  // ======================
  // GET MOOD HISTORY
  // ======================
  app.get("/mood", { preHandler: authMiddleware }, async (req, reply) => {

    try {

      const userId = (req as any).user.id;

      const [rows] = await pool.query(
        "SELECT * FROM moods WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );

      return reply.send(rows);

    } catch (error) {
      console.log("GET MOOD ERROR:", error);

      return reply.status(500).send({
        error: "Failed to fetch moods"
      });
    }
  });

  app.get("/dashboard", { preHandler: authMiddleware }, async (req, reply) => {

    try {

      const userId = (req as any).user.id;

      const [chatRows]: any = await pool.query(
        "SELECT COUNT(*) as total FROM chats WHERE user_id = ?",
        [userId]
      );

      const [moodRows]: any = await pool.query(
        `
      SELECT mood, COUNT(*) as total
      FROM moods
      WHERE user_id = ?
      GROUP BY mood
      `,
        [userId]
      );

      const stats = {
        totalChats: chatRows[0].total,
        happy: 0,
        sad: 0,
        anxiety: 0,
        angry: 0,
        neutral: 0
      };

      moodRows.forEach((item: any) => {

        if (item.mood === "Happy") stats.happy = item.total;

        if (item.mood === "Sad") stats.sad = item.total;

        if (item.mood === "Anxiety") stats.anxiety = item.total;

        if (item.mood === "Angry") stats.angry = item.total;

        if (item.mood === "Neutral") stats.neutral = item.total;

      });

      return reply.send(stats);

    } catch (err) {

      console.log(err);

      return reply.status(500).send({
        error: "Dashboard Error"
      });

    }

  });
}

