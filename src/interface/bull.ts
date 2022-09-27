export enum EmailTriggerTypeEnum {
  servicepurchase = "servicepurchase",
  serviceassign = "serviceassign",
  servicereview = "servicereview",
  servicereuploadrequest = "servicereuploadrequest",
  servicereupload = "servicereupload",
  servicesubmitted = "servicesubmitted",
  servicerejected = "servicerejected",
  serviceresubmission = "serviceresubmission",
  servicedelivery = "servicedelivery",
  servicerevisionrequest = "servicerevisionrequest",
  servicerevisiondelivery = "servicerevisiondelivery",
  servicecomplete = "servicecomplete",
  serviceaddonrequest = "serviceaddonrequest",
  serviceaddondelivery = "serviceaddondelivery",
}

export interface IEmailCommunicationQueue {
  email: string;
  customer?: string;
  engineer?: string;
  amount?: number;
  service?: string;
  project?: string;
  notes?: string;
  type: EmailTriggerTypeEnum;
}
