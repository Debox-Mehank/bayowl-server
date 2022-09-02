import { prop } from "@typegoose/typegoose";
import mongoose from "mongoose";
import { InputType, Field, ID } from "type-graphql";

@InputType()
class AddOnInput {
  @Field(() => String, { nullable: false })
  type: string;

  @Field(() => String, { nullable: false })
  value: string;
}

@InputType()
export class ServicesInput {
  @Field(() => String, { nullable: false })
  serviceCategory: string;

  @Field(() => String, { nullable: false })
  serviceName: string;

  @Field(() => String, { nullable: false })
  subService: string;

  @Field(() => String, { nullable: false })
  subSubService: string;

  @Field(() => String, { nullable: false })
  for: string;

  @Field(() => String, { nullable: false })
  description: string;

  @Field(() => String, { nullable: false })
  estimatedTime: string;

  @Field(() => Number, { nullable: false })
  price: number;

  @Field(() => Number, { nullable: false })
  inputLimit: number;

  @Field(() => [AddOnInput], { nullable: false })
  addOn: AddOnInput[];
}
