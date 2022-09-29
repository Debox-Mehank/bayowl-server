import { prop } from "@typegoose/typegoose";
import { Field, ObjectType, registerEnumType } from "type-graphql";

export enum DashboardEnum {
  NumberOfCustomersRegistered = "NumberOfCustomersRegistered",
  NumberOfCustomersWithPaidService = "NumberOfCustomersWithPaidService",
  NumberOfPaidService = "NumberOfPaidService",
  NumberOfServicesPendingAcceptance = "NumberOfServicesPendingAcceptance",
  NumberOfServicesPendingAcceptanceCustomer = "NumberOfServicesPendingAcceptanceCustomer",
  NumberOfServicesInProgress = "NumberOfServicesInProgress",
  NumberOfServicesCompleted = "NumberOfServicesCompleted",
  NumberOfServicesAssigned = "NumberOfServicesAssigned",
  NumberOfServicesForRevision = "NumberOfServicesForRevision",
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
