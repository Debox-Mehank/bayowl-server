import { getModelForClass, index, prop, Ref } from "@typegoose/typegoose";
import { Field, ID, ObjectType } from "type-graphql";
import { Admin } from "../../admin/schema/admin.schema";

@index({ loginContent: 1 })
@ObjectType()
export class DashboardContent {
  @Field(() => ID)
  _id: string;

  @Field(() => Admin)
  @prop({ ref: () => Admin })
  lastUpdatedBy: Ref<Admin>;

  @Field(() => Admin)
  @prop({ ref: () => Admin })
  createdBy: Ref<Admin>;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  text: string;

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
