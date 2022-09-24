import { getModelForClass, plugin, prop, Ref } from "@typegoose/typegoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from "type-graphql";
import { Admin } from "../../admin/schema/admin.schema";

export enum PaymentConfigEnum {
  gst = "gst",
}

registerEnumType(PaymentConfigEnum, {
  name: "PaymentConfigEnum",
  description: "Enum For Type of Payment Configs",
});

@plugin(mongooseAutoPopulate)
@ObjectType()
export class PaymentConfig {
  @Field(() => ID)
  _id: string;

  @Field(() => PaymentConfigEnum, { nullable: true })
  @prop({ required: true })
  type: PaymentConfigEnum;

  @Field(() => Number, { nullable: false })
  @prop({ required: true, default: true })
  value: number;

  @Field(() => Boolean, { nullable: false })
  @prop({ default: true })
  active: boolean;

  @Field(() => Admin, { nullable: true })
  @prop({ ref: () => Admin, autopopulate: true, nullable: true, default: null })
  lastUpdatedBy: Ref<Admin>;

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

@InputType()
export class PaymentConfigInput {
  @Field(() => PaymentConfigEnum, { nullable: true })
  type: PaymentConfigEnum;

  @Field(() => Number, { nullable: false })
  value: number;

  @Field(() => Boolean, { nullable: false })
  active: boolean;

  @Field(() => ID, { nullable: true })
  lastUpdatedBy: string;
}

export const PaymentConfigModel = getModelForClass(PaymentConfig, {
  schemaOptions: { timestamps: true },
});
