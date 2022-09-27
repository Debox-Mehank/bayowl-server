import { Job } from "bull";
import {
  EmailTriggerTypeEnum,
  IEmailCommunicationQueue,
} from "../../interface/bull";
import { servicePurchaseMail } from "../../mails";

export const sendCommunication = async (job: Job<IEmailCommunicationQueue>) => {
  const type = job.data.type;
  switch (type) {
    case EmailTriggerTypeEnum.servicepurchase:
      await servicePurchaseMail(
        job.data.email,
        job.data.customer ?? "",
        job.data.service ?? "",
        job.data.amount ?? 0
      );
      break;
    case EmailTriggerTypeEnum.serviceassign:
      break;
    case EmailTriggerTypeEnum.servicereview:
      break;
    case EmailTriggerTypeEnum.servicereview:
      break;
    case EmailTriggerTypeEnum.servicereview:
      break;
    case EmailTriggerTypeEnum.servicereview:
      break;
    case EmailTriggerTypeEnum.servicereview:
      break;
    case EmailTriggerTypeEnum.servicereview:
      break;
    case EmailTriggerTypeEnum.servicereview:
      break;
    case EmailTriggerTypeEnum.servicereview:
      break;
  }
};
