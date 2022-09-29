import { Job } from "bull";
import {
  EmailTriggerTypeEnum,
  IEmailCommunicationQueue,
} from "../../interface/bull";
import {
  addonDelivery,
  addOnPurchase,
  addonRequest,
  internalRevisionSubmission,
  sendEnquiryMail,
  serviceAssignmentInternal,
  serviceCompletion,
  serviceDelivery,
  servicePurchaseMail,
  serviceQACheck,
  serviceQAReject,
  serviceReuploaded,
  serviceReuploadRequest,
  serviceReviewAcceptance,
  serviceRevisionDelivery,
  serviceRevisionRequest,
} from "../../mails";

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
      await serviceAssignmentInternal(
        job.data.email,
        job.data.customer ?? "",
        job.data.service ?? "",
        job.data.engineer ?? "",
        job.data.project ?? ""
      );
      break;
    case EmailTriggerTypeEnum.servicereuploadrequest:
      await serviceReuploadRequest(
        job.data.email,
        job.data.customer ?? "",
        job.data.engineer ?? "",
        job.data.project ?? "",
        job.data.notes ?? "",
        job.data.service ?? ""
      );
      break;
    case EmailTriggerTypeEnum.servicereupload:
      await serviceReuploaded(
        job.data.email,
        job.data.customer ?? "",
        job.data.engineer ?? "",
        job.data.project ?? "",
        job.data.service ?? ""
      );
      break;
    case EmailTriggerTypeEnum.servicereview:
      await serviceReviewAcceptance(
        job.data.email,
        job.data.customer ?? "",
        job.data.engineer ?? "",
        job.data.project ?? "",
        job.data.service ?? ""
      );
      break;
    case EmailTriggerTypeEnum.servicesubmitted:
      await serviceQACheck(
        job.data.customer ?? "",
        job.data.engineer ?? "",
        job.data.project ?? ""
      );
      break;
    case EmailTriggerTypeEnum.servicerejected:
      await serviceQAReject(
        job.data.email,
        job.data.customer ?? "",
        job.data.engineer ?? "",
        job.data.project ?? "",
        job.data.service ?? "",
        job.data.notes ?? ""
      );
      break;
    case EmailTriggerTypeEnum.serviceresubmission:
      await internalRevisionSubmission(
        job.data.customer ?? "",
        job.data.engineer ?? "",
        job.data.project ?? ""
      );
      break;
    case EmailTriggerTypeEnum.servicedelivery:
      await serviceDelivery(
        job.data.email,
        job.data.customer ?? "",
        job.data.project ?? ""
      );
      break;
    case EmailTriggerTypeEnum.servicerevisionrequest:
      await serviceRevisionRequest(
        job.data.email,
        job.data.customer ?? "",
        job.data.engineer ?? "",
        job.data.project ?? "",
        job.data.service ?? "",
        job.data.notes ?? ""
      );
      break;
    case EmailTriggerTypeEnum.servicerevisiondelivery:
      await serviceRevisionDelivery(
        job.data.email,
        job.data.customer ?? "",
        job.data.project ?? ""
      );
      break;
    case EmailTriggerTypeEnum.servicecomplete:
      await serviceCompletion(
        job.data.email,
        job.data.customer ?? "",
        job.data.engineer ?? "",
        job.data.project ?? "",
        job.data.notes ?? ""
      );
      break;
    case EmailTriggerTypeEnum.serviceaddonpurchase:
      await addOnPurchase(
        job.data.email,
        job.data.customer ?? "",
        job.data.service ?? "",
        job.data.amount ?? 0
      );
      break;
    case EmailTriggerTypeEnum.serviceaddonrequest:
      await addonRequest(
        job.data.email,
        job.data.customer ?? "",
        job.data.engineer ?? "",
        job.data.project ?? "",
        job.data.service ?? "",
        job.data.notes ?? ""
      );
      break;
    case EmailTriggerTypeEnum.serviceaddondelivery:
      await addonDelivery(
        job.data.email,
        job.data.customer ?? "",
        job.data.project ?? ""
      );
      break;
    case EmailTriggerTypeEnum.contactenquiry:
      await sendEnquiryMail(
        job.data.email,
        job.data.project ?? "",
        job.data.notes ?? "",
        job.data.customer ?? ""
      );
      break;
  }
};
