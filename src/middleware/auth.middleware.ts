
import jwt from "jsonwebtoken";
import { FastifyRequest, FastifyReply } from "fastify";

export async function authMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
) {

  try {
     console.log(req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader) {

      return reply.status(401).send({
        message: "No token provided"
      });

    }

    const token = authHeader.split(" ")[1];

      console.log(token);


    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!

    );

    (req as any).user = decoded;

  }

  catch (err) {

    console.log(err);

    return reply.status(401).send({
      message: "Invalid token"
    });

  }

}