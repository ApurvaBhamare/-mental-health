import { FastifyInstance } from "fastify";
import { pool } from "../config/db";
import { authMiddleware } from "../middleware/auth.middleware";

export async function chatRoutes(app: FastifyInstance) {

  // =========================
  // CHAT API (WITH MEMORY)
  // =========================

  app.post(
    "/chat",
    { preHandler: authMiddleware },

    async (req, reply) => {

      try {

        const { message } = req.body as any;

        if (!message || message.trim() === "") {
          return reply.status(400).send({
            error: "Message is required"
          });
        }

        const userId = (req as any).user.id;
        const userName = (req as any).user.name || "User";

        console.log("User:", userName);
        console.log("Message:", message);

        // =========================
        // 🧠 CHAT MEMORY (LAST 10 MSG)
        // =========================
        const [history]: any = await pool.query(
          `
          SELECT message, reply
          FROM chats
          WHERE user_id = ?
          ORDER BY id DESC
          LIMIT 10
          `,
          [userId]
        );

        const chatContext = history
          .reverse()
          .map((h: any) => {
            return `User: ${h.message}\nAI: ${h.reply}`;
          })
          .join("\n");

        // =========================
        // 🤖 OLLAMA CALL
        // =========================
        const response = await fetch(
          "http://localhost:11434/api/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "qwen2.5:1.5b",

              prompt: `
      You are MindSathi AI.
       You are a calm, supportive mental health assistant.

       Always talk like a friendly human.

      User Name: ${userName}

     Previous Conversation:
     ${chatContext}

     User Message:
     ${message}

    Reply in simple and supportive English.
              `,

              stream: false
            })
          }
        );

        if (!response.ok) {
          return reply.status(500).send({
            error: "Ollama server not responding"
          });
        }

        const data: any = await response.json();

        const aiReply =
          data.response?.trim() ||
          "Sorry, I could not generate reply.";

        console.log("AI Reply:", aiReply);

        // =========================
        // 💾 SAVE CHAT TO DB
        // =========================
        await pool.query(
          `
          INSERT INTO chats
          (user_id, message, reply)
          VALUES (?, ?, ?)
          `,
          [userId, message, aiReply]
        );

        return reply.send({
          reply: aiReply
        });

      } catch (err) {

        console.log("CHAT ERROR:", err);

        return reply.status(500).send({
          error: "AI failed"
        });

      }
    }
  );

  // =========================
  // GET ALL CHATS
  // =========================

  app.get(
    "/chats",
    { preHandler: authMiddleware },

    async (req, reply) => {

      const userId = (req as any).user.id;

      const [rows] = await pool.query(
        `
        SELECT *
        FROM chats
        WHERE user_id = ?
        ORDER BY created_at ASC
        `,
        [userId]
      );

      return reply.send(rows);
    }
  );

  // =========================
  // GET SINGLE CHAT
  // =========================

  app.get(
    "/chat/:id",
    { preHandler: authMiddleware },

    async (req, reply) => {

      const userId = (req as any).user.id;
      const { id } = req.params as any;

      const [rows]: any = await pool.query(
        `
        SELECT *
        FROM chats
        WHERE id = ?
        AND user_id = ?
        `,
        [id, userId]
      );

      if (!rows || rows.length === 0) {
        return reply.status(404).send({
          error: "Chat not found"
        });
      }

      return reply.send(rows[0]);
    }
  );

  // =========================
  // DELETE CHAT
  // =========================

  app.delete(
    "/chat/:id",
    { preHandler: authMiddleware },

    async (req, reply) => {

      const userId = (req as any).user.id;
      const { id } = req.params as any;

      await pool.query(
        `
        DELETE FROM chats
        WHERE id = ?
        AND user_id = ?
        `,
        [id, userId]
      );

      return reply.send({
        message: "Chat deleted successfully"
      });
    }
  );

}