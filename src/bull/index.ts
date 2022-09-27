import Bull from "bull";
import dotenv from "dotenv";
import { IEmailCommunicationQueue } from "../interface/bull";
import { sendCommunication } from "./process/communication";
dotenv.config();

export const EmailCommunicationQueue = new Bull<IEmailCommunicationQueue>(
  "BayOwlEmailCommunicationQueue",
  {
    redis: {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    },
  }
);

EmailCommunicationQueue.process(sendCommunication);

export const addToCommunicationsQueue = async (
  data: IEmailCommunicationQueue
) => {
  await EmailCommunicationQueue.add(data, {
    removeOnComplete: true,
    removeOnFail: false,
  });
};
