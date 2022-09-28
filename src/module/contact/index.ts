import { Request, Response } from "express";
import { addToCommunicationsQueue } from "../../bull";
import { EmailTriggerTypeEnum } from "../../interface/bull";
import { ContactsModel } from "./schema/contact.schema";

export const contactFormHandler = async (req: Request, res: Response) => {
  const { fullname, message, phone, email } = req.body;
  await ContactsModel.create({
    fullname: fullname,
    message: message,
    phone: phone,
    email: email,
  });
  await addToCommunicationsQueue({
    email: email,
    type: EmailTriggerTypeEnum.contactenquiry,
    customer: fullname,
    notes: message,
    project: phone,
  });

  res.status(200).send(true);
};
