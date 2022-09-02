import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Field, ID, InputType, ObjectType } from "type-graphql";

@ObjectType()
class AddOn {
  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  type: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  value: string;
}

@ObjectType()
export class Services {
  @Field(() => ID)
  _id: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  serviceCategory: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  serviceName: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  subService: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  subSubService: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  for: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  description: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  estimatedTime: string;

  @Field(() => Number, { nullable: false })
  @prop({ required: true })
  price: number;

  @Field(() => Number, { nullable: false })
  @prop({ required: true })
  inputLimit: number;

  //

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  fileFormat: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  deliveryFormat: string;

  @Field(() => Number, { nullable: false })
  @prop({ required: true })
  deliveryDays: number;

  @Field(() => [AddOn], { nullable: false })
  @prop()
  addOn: mongoose.Types.Array<AddOn>;

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const ServicesModel = getModelForClass(Services, {
  schemaOptions: { timestamps: true },
});
