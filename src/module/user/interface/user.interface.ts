import { prop, Ref } from "@typegoose/typegoose";
import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import { Admin } from "../../admin/schema/admin.schema";
import { ServicesInput } from "../../services/interface/services.input";
import { Services } from "../../services/schema/services.schema";

export enum UserServiceStatus {
  pendingupload = "Pending Upload",
  submitted = "Submitted",
  underreview = "Under Review",
  workinprogress = "Work In Progress",
  delivered = "Delivered",
  revisionrequest = "Revision Request",
  revisiondelivered = "Revision Delivered",
  completed = "Completed",
}

registerEnumType(UserServiceStatus, {
  name: "UserServiceStatus",
  description: "Enum for status of user service",
});

@ObjectType()
export class UserServices extends Services {
  @Field(() => String, { nullable: true })
  @prop({ default: null })
  projectName: string;

  @Field(() => Boolean)
  @prop({ default: false })
  paid: boolean;

  @Field(() => Admin, { nullable: true })
  @prop({ ref: () => Admin, nullable: true, default: null })
  assignedTo: Ref<Admin>;

  @Field(() => Admin, { nullable: true })
  @prop({ ref: () => Admin, nullable: true, default: null })
  assignedBy: Ref<Admin>;

  @Field(() => UserServiceStatus, { nullable: true })
  @prop({ default: UserServiceStatus.pendingupload })
  status: UserServiceStatus;
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
