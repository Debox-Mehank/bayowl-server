import { mongoose, prop, Ref } from "@typegoose/typegoose";
import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Admin } from "../../admin/schema/admin.schema";
import { ServicesInput } from "../../services/interface/services.input";
import { Services } from "../../services/schema/services.schema";

export enum UserServiceStatus {
  pendingupload = "Pending Upload",
  underreview = "Under Review",
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

  @Field(() => Admin, { nullable: true })
  @prop({ ref: () => Admin, nullable: true, default: null })
  assignedTo: Ref<Admin>;

  @Field(() => Admin, { nullable: true })
  @prop({ ref: () => Admin, nullable: true, default: null })
  assignedBy: Ref<Admin>;

  @Field(() => UserServiceStatus, { nullable: false })
  @prop({ default: UserServiceStatus.pendingupload })
  statusType: UserServiceStatus;

  @Field(() => [ServiceStatusObject], { nullable: false })
  @prop({ type: ServiceStatusObject, default: defaultStatus })
  status: mongoose.Types.Array<ServiceStatusObject>;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  reupload: Date;
}

@InputType()
export class UserServicesInput extends ServicesInput {
  @Field(() => String, { nullable: true })
  projectName: string;
}

@InputType()
export class UserServicesStatusInput {
  @Field(() => UserServiceStatus)
  status: UserServiceStatus;
}
