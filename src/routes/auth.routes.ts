
import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.middleware";
import { pool } from "../config/db";




export async function authRoutes(app: FastifyInstance) {
// REGISTER

app.post("/register", async (req, reply) => {

  try {

    const { name, email, password } = req.body as any;

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(

      `INSERT INTO users(name,email,password)
       VALUES(?,?,?)`,

      [name, email, hashedPassword]

    );

    return reply.send({

      message: "User registered successfully"

    });

  }

  catch (err: any) {

  console.log("REGISTER ERROR:");

  console.log(err);

  return reply.status(500).send({
    error: "Registration failed"
  });

}

});  


  // LOGIN
  app.post("/login", async (req, reply) => {
    try {

      const { email, password } = req.body as any;

      const [rows]: any = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if (rows.length === 0) {
        return reply.send({ message: "User not found" });
      }

      const user = rows[0];

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return reply.send({ message: "Invalid password" });
      }

      // const token = jwt.sign(
      //   { id: user.id, 
      //     name: user.name,
      //     email: user.email },
        
      //    process.env.JWT_SECRET!,

      //   { expiresIn: "1d" }
      // );

      const token = jwt.sign(
  {
    id: user.id,
    name: user.name,
    email: user.email
  },
  process.env.JWT_SECRET!,
  {
    expiresIn: "1d"
  }
);

      return reply.send({
        message: "Login successful",
        token
      });

    } catch (err) {
      console.log(err);
      return reply.status(500).send({ error: "Server error" });
    }
  });

  // 🔐 PROFILE (ADD THIS)
  app.get("/profile", { preHandler: authMiddleware }, async (req, reply) => {
    return reply.send({
      message: "This is protected data",
      user: (req as any).user
    });
  });

}                    