import { FastifyInstance } from "fastify";
import { pool } from "../config/db";
import { authMiddleware } from "../middleware/auth.middleware";


function detectMood(message: string) {

  const text = message.toLowerCase();

  if (
    text.includes("sad") ||
    text.includes("cry") ||
    text.includes("depressed") ||
    text.includes("lonely")||
    text.includes("alone")||
    text.includes("heavy")
  ) {
    return "Sad";
  }

  if (
    text.includes("happy") ||
    text.includes("great") ||
    text.includes("good") ||
    text.includes("awesome")||
    text.includes("enthusiastic")
  ) {
    return "Happy";
  }

  if (
    text.includes("anxiety") ||
    text.includes("stress") ||
    text.includes("worried") ||
    text.includes("panic")
  ) {
    return "Anxiety";
  }

  if (
    text.includes("angry") ||
    text.includes("hate") ||
    text.includes("frustrated")
  ) {
    return "Angry";
  }

  return "Neutral";
}

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
              // model: "llama3.2:3b"
            //  model: "gemma3:4b",
             model: "llama3.2:3b",


   prompt: `
You are MindSathi, a friendly AI mental health assistant.

VERY IMPORTANT RULES:

1. Reply ONLY in the same language used by the user.

2. If the user writes in English,
reply in English.

3. If the user writes in Marathi script (उदा. "मला खूप वाईट वाटतं"),
reply in Marathi script.

4. If the user writes Marathi using English letters
(example:
"mla khup vait vataty"
"mala khup sad feel hotay"
"kasa ahes"),

reply ONLY in Roman Marathi using English letters.

Never translate Roman Marathi into English.

Examples:

User: hi
AI: Hello! How are you today?

User: I am feeling low
AI: I'm sorry you're feeling this way. Would you like to talk about it?

User: mala khup vait vataty
AI: Mala khup vait vatatay he aikun mala vait vatla. Mi tujhya sobat aahe. Kay zala te sangshil ka?

User: mi khup lonely ahe
AI: Ekta vatnan khup avghad asta. Tu ekta nahis. Mi aikayla ithe aahe.

Be supportive.
Be empathetic.
Keep replies short (3-5 sentences).

User message:
${message}
`,
              stream: false,
               options: {
        temperature: 0.3
    }
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
const mood = detectMood(message);

await pool.query(
`
INSERT INTO moods
(user_id,mood,message)
VALUES(?,?,?)
`,
[userId,mood,message]
);

console.log("Mood Saved:", mood);
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