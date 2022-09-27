import { prop } from "@typegoose/typegoose";
import { Field, ObjectType, registerEnumType } from "type-graphql";

export enum DashboardEnum {
  NumberOfCustomersRegistered = "NumberOfCustomersRegistered",
  NumberOfCustomersWithPaidService = "NumberOfCustomersWithPaidService",
  NumberOfServicesPendingAcceptance = "NumberOfServicesPendingAcceptance",
  NumberOfServicesInProgress = "NumberOfServicesInProgress",
  NumberOfServicesCompleted = "NumberOfServicesCompleted",
}

registerEnumType(DashboardEnum, {
  name: "DashboardEnum",
  description: "Enum For Type of dashboard data",
});

@ObjectType()
export class DashboardInterfaceClass {
  @Field(() => DashboardEnum, { nullable: false })
  @prop({ required: true })
  label: DashboardEnum;

  @Field(() => Number, { nullable: false })
  @prop({ required: true })
  data: number;
}
