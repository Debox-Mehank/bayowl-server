import { getModelForClass, plugin, prop, Ref } from "@typegoose/typegoose";
import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from "type-graphql";

@ObjectType()
export class Contacts {
  @Field(() => ID)
  _id: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true })
  fullname: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true })
  email: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true })
  phone: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true })
  message: string;

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const ContactsModel = getModelForClass(Contacts, {
  schemaOptions: { timestamps: true },
});
