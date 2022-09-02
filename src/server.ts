import dotenv from "dotenv";
dotenv.config();
import "reflect-metadata";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import { connectToDb } from "./utils/connectDb";
import apolloServerConfig from "./utils/apolloServer";

// import { worker } from "./modules/bull/worker/index";
const port = process.env.PORT || 4000;

const app = express();
const httpServer = http.createServer(app);

// Middleware and healthchecks
app.use(cookieParser());

// Apollo Server
apolloServerConfig(httpServer, app);

// Mongo Connection
connectToDb();

httpServer.listen({ port }, () => {
  // useServer({ schema }, wsServer);
  console.info(`Graphql server started on port : ${port}`);
});
