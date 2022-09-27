import { mongoose, prop, Ref } from "@typegoose/typegoose";
import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Admin } from "../../admin/schema/admin.schema";
import {
  AddOnInput,
  ServicesInput,
} from "../../services/interface/services.input";
import { AddOn, Services } from "../../services/schema/services.schema";

export enum UserServiceStatus {
  pendingupload = "Pending Upload",
  underreview = "Under Review",
  underreviewinternal = "Under Review Internally",
  workinprogress = "Work In Progress",
  delivered = "Delivered",
  revisionrequest = "Revision Request",
  revisiondelivered = "Revision Delivered",
  completed = "Completed",
}

export enum ServiceStatusObjectState {
  completed = "completed",
  current = "current",
  pending = "pending",
}

registerEnumType(UserServiceStatus, {
  name: "UserServiceStatus",
  description: "Enum for status of user service",
});

registerEnumType(ServiceStatusObjectState, {
  name: "ServiceStatusObjectState",
  description: "Enum for state",
});

@ObjectType()
export class ServiceStatusObject {
  @Field(() => UserServiceStatus, { nullable: true })
  @prop({ default: null })
  name: UserServiceStatus;

  @Field(() => ServiceStatusObjectState, { nullable: false })
  @prop({ default: false })
  state: ServiceStatusObjectState;
}

@ObjectType()
export class RevisionFiles {
  @Field(() => String, { nullable: true })
  @prop({ default: null })
  file: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  description: string;

  @Field(() => Number, { nullable: false })
  @prop({ default: 1 })
  revision: number;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  revisionTime: Date;

  @Field(() => Number, { nullable: false })
  @prop({ default: 0 })
  revisionFor: number;
}

@ObjectType()
export class DeliveredFiles {
  @Field(() => String, { nullable: true })
  @prop({ default: null })
  file: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  description: string;

  @Field(() => Number, { nullable: false })
  @prop({ default: 1 })
  revision: number;
}

export const defaultStatus: ServiceStatusObject[] = [
  {
    name: UserServiceStatus.pendingupload,
    state: ServiceStatusObjectState.current,
  },
  {
    name: UserServiceStatus.underreview,
    state: ServiceStatusObjectState.pending,
  },
  {
    name: UserServiceStatus.workinprogress,
    state: ServiceStatusObjectState.pending,
  },
  {
    name: UserServiceStatus.delivered,
    state: ServiceStatusObjectState.pending,
  },
  {
    name: UserServiceStatus.revisionrequest,
    state: ServiceStatusObjectState.pending,
  },
  {
    name: UserServiceStatus.revisiondelivered,
    state: ServiceStatusObjectState.pending,
  },
  {
    name: UserServiceStatus.completed,
    state: ServiceStatusObjectState.pending,
  },
];

@ObjectType()
export class UserServices extends Services {
  @Field(() => String, { nullable: true })
  @prop({ default: null })
  projectName: string;

  @Field(() => Boolean)
  @prop({ default: false })
  paid: boolean;

  @Field(() => [String], { nullable: false })
  @prop({
    type: String,
    default: [],
  })
  uploadedFiles: mongoose.Types.Array<string>;

  @Field(() => [String], { nullable: false })
  @prop({
    type: String,
    default: [],
  })
  referenceFiles: mongoose.Types.Array<string>;

  @Field(() => [RevisionFiles], { nullable: false })
  @prop({
    type: RevisionFiles,
    default: [],
  })
  revisionFiles: mongoose.Types.Array<RevisionFiles>;

  @Field(() => [String], { nullable: true })
  @prop({
    type: String,
    default: [],
  })
  deliveredFiles: mongoose.Types.Array<string>;

  @Field(() => Admin, { nullable: true })
  @prop({ ref: () => Admin, nullable: true, default: null })
  assignedTo: Ref<Admin>;

  @Field(() => Admin, { nullable: true })
  @prop({ ref: () => Admin, nullable: true, default: null })
  assignedBy: Ref<Admin>;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  assignedTime: Date;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  masterProjectApprovalTime: Date;

  @Field(() => UserServiceStatus, { nullable: false })
  @prop({ default: UserServiceStatus.pendingupload })
  statusType: UserServiceStatus;

  @Field(() => [ServiceStatusObject], { nullable: false })
  @prop({ type: ServiceStatusObject, default: defaultStatus })
  status: mongoose.Types.Array<ServiceStatusObject>;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  reupload: Date;

  @Field(() => Number, { nullable: true })
  @prop({ default: 0 })
  requestReuploadCounter: number;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  notes: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  revisionNotesByMaster: string;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  revisionTimeByMaster: Date;

  @Field(() => Number, { nullable: true })
  @prop({ default: 0 })
  numberOfRevisionsByMaster: Number;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  submissionDate: Date;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  estDeliveryDate: Date;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  completionDate: Date;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  reuploadNote: string;

  @Field(() => String, { nullable: true })
  @prop({
    type: String,
    default: null,
  })
  workingFile: string;

  @Field(() => Boolean)
  @prop({ default: false })
  addOnExtraRevision: boolean;

  @Field(() => Boolean)
  @prop({ default: false })
  addOnExportsBusStems: boolean;

  @Field(() => Boolean)
  @prop({ default: false })
  addOnExportsMultitrack: boolean;

  @Field(() => String, { nullable: true })
  @prop({
    type: String,
    default: null,
  })
  multitrackFile: string;

  @Field(() => String, { nullable: true })
  @prop({
    type: String,
    default: null,
  })
  stemsFiles: string;

  @Field(() => Number, { nullable: true })
  @prop({ default: null })
  completedFor: number;

  @Field(() => [AddOn], { nullable: true })
  @prop({ default: [] })
  allAddOns: mongoose.Types.Array<AddOn>;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  paidAt: Date;
}

@InputType()
export class UserServicesInput extends ServicesInput {
  @Field(() => String, { nullable: true })
  projectName: string;

  @Field(() => [AddOnInput], { nullable: false })
  allAddOns: AddOnInput[];
}

@InputType()
export class UserServicesStatusInput {
  @Field(() => UserServiceStatus)
  status: UserServiceStatus;
}

@ObjectType()
export class FileUploadResponse {
  @Field(() => String, { nullable: true })
  fileId?: string;

  @Field(() => String, { nullable: true })
  fileKey?: string;
}

@ObjectType()
export class MultipartSignedUrlResponse {
  @Field(() => String, { nullable: true })
  signedUrl?: string;

  @Field(() => Number, { nullable: true })
  PartNumber?: number;
}

@InputType()
export class FinalMultipartUploadPartsInput {
  @Field(() => Number, { nullable: true })
  PartNumber: number;

  @Field(() => String, { nullable: true })
  ETag: string;
}

@InputType()
export class FinalMultipartUploadInput {
  @Field(() => String, { nullable: true })
  fileId: string;

  @Field(() => String, { nullable: true })
  fileKey: string;

  @Field(() => [FinalMultipartUploadPartsInput], { nullable: true })
  parts: FinalMultipartUploadPartsInput[];
}
