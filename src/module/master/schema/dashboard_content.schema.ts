import {
  getModelForClass,
  index,
  plugin,
  prop,
  Ref,
} from "@typegoose/typegoose";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { Field, ID, ObjectType } from "type-graphql";
import { Admin } from "../../admin/schema/admin.schema";

@index({ loginContent: 1 })
@plugin(mongooseAutoPopulate)
@ObjectType()
export class DashboardContent {
  @Field(() => ID)
  _id: string;

  @Field(() => Admin)
  @prop({ ref: () => Admin, autopopulate: true })
  lastUpdatedBy: Ref<Admin>;

  @Field(() => Admin)
  @prop({ ref: () => Admin, autopopulate: true })
  createdBy: Ref<Admin>;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  image: string;

  @Field(() => Boolean)
  @prop({ default: true })
  active: boolean;

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const DashboardContentModel = getModelForClass(DashboardContent, {
  schemaOptions: { timestamps: true },
});
