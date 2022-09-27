import dotenv from "dotenv";
dotenv.config();
import "reflect-metadata";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import { connectToDb } from "./utils/connectDb";
import apolloServerConfig from "./utils/apolloServer";
import {
  paymentCallbackHandler,
  paymentCallbackHandlerAddonBoth,
  paymentCallbackHandlerAddonMultitrack,
  paymentCallbackHandlerAddonRevision,
  paymentCallbackHandlerAddonStems,
  paymentLinkCallbackHandler,
} from "./module/payment/controller/callback";
import { EmailCommunicationQueue } from "./bull";

// import { worker } from "./modules/bull/worker/index";
const port = process.env.PORT || 4000;

const app = express();
const httpServer = http.createServer(app);

// Middleware and healthchecks
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apollo Server
apolloServerConfig(httpServer, app);

// Mongo Connection
connectToDb();

// AWS Healthcheck
app.get("/", (req, res) => {
  res.status(200).json({ healthy: true });
});

// Payment callback
app.get("/api/payments/paymentlink/callback", paymentLinkCallbackHandler);
app.post("/api/payments/pg/callback", paymentCallbackHandler);
app.post(
  "/api/payments/pg/callbackMultitrack",
  paymentCallbackHandlerAddonMultitrack
);
app.post("/api/payments/pg/callbackStems", paymentCallbackHandlerAddonStems);
app.post("/api/payments/pg/callbackAddOnBoth", paymentCallbackHandlerAddonBoth);
app.post(
  "/api/payments/pg/callbackRevision",
  paymentCallbackHandlerAddonRevision
);

// Queue Callbacks
EmailCommunicationQueue.on("completed", (job) =>
  console.log(`Completed job communications ${job.id} successfully`)
);
EmailCommunicationQueue.on("failed", (job, err) =>
  console.log(`Failed job communications ${job.id} with ${err}`)
);

httpServer.listen({ port }, () => {
  // useServer({ schema }, wsServer);
  console.info(`Graphql server started on port : ${port}`);
});
