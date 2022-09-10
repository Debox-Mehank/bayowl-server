import { getModelForClass, prop } from "@typegoose/typegoose";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Payment {
  @Field(() => ID)
  _id: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true })
  email: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  orderId: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  paymentId: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  paymentLinkId: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  signature: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  userServiceId: string;

  @Field(() => Number, { nullable: false })
  @prop({ required: true })
  amount: number;

  @Field(() => String, { nullable: true })
  @prop({ default: null })
  status: string;

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const PaymentModel = getModelForClass(Payment, {
  schemaOptions: { timestamps: true },
});
