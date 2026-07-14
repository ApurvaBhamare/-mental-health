
// import jwt from "jsonwebtoken";
// import { FastifyRequest, FastifyReply } from "fastify";

// export async function authMiddleware(
//   req: FastifyRequest,
//   reply: FastifyReply
// ) {

//   try {
//      console.log(req.headers.authorization);

//     const authHeader = req.headers.authorization;

//     if (!authHeader) {

//       return reply.status(401).send({
//         message: "No token provided"
//       });

//     }

//     const token = authHeader.split(" ")[1];

// console.log("Authorization Header:", authHeader);
// console.log("Token:", token);
// console.log("JWT Secret:", process.env.JWT_SECRET);
//       console.log(token);


//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET!

//     );
// console.log("DECODED:", decoded); 


//     (req as any).user = decoded;

//   }

//   catch (err) {

//     console.log("JWT ERROR:",err);

//     return reply.status(401).send({
//       message: "Invalid token"
//     });

//   }
// //   catch (err) {
// //   console.log("JWT ERROR:", err);

// //   return reply.status(401).send({
// //     message: "Invalid token"
// //   });
// // }

// }


  import jwt from "jsonwebtoken";
import { FastifyRequest, FastifyReply } from "fastify";

export async function authMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {

    const authHeader = req.headers.authorization;

    console.log("Authorization Header:", authHeader);

    if (!authHeader) {
      return reply.status(401).send({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    console.log("Token:", token);
    console.log("JWT Secret:", process.env.JWT_SECRET);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    console.log("DECODED USER:", decoded);

    (req as any).user = decoded;

  } catch (err) {

    console.log("JWT ERROR:", err);

    return reply.status(401).send({
      message: "Invalid token"
    });

  }
}