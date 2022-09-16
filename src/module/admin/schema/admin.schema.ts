import {
  getModelForClass,
  index,
  plugin,
  pre,
  prop,
  Ref,
} from "@typegoose/typegoose";
import bcrypt from "bcrypt";
import mongooseAutoPopulate from "mongoose-autopopulate";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";

export enum AdminRole {
  master = "master",
  manager = "manager",
  employee = "employee",
}

registerEnumType(AdminRole, {
  name: "AdminRole",
  description: "Enum For Type of Admin Roles i.e. Master, Admin & Normal",
});

@pre<Admin>("save", async function () {
  // check if password is being modified
  if (!this.isModified("password")) {
    return;
  }

  // hash password
  const salt = await bcrypt.genSalt(10);
  const hash = bcrypt.hashSync(this.password, salt);

  this.password = hash;
})
@index({ email: 1, name: 1 })
@plugin(mongooseAutoPopulate)
@ObjectType()
export class Admin {
  @Field(() => ID, { nullable: true })
  _id: string;

  @Field(() => String, { nullable: true })
  @prop({ required: true, trim: true })
  name: string;

  @Field(() => String, { nullable: true })
  @prop({ required: true, unique: true, trim: true })
  email: string;

  @prop({ required: true, trim: true })
  password: string;

  @Field(() => AdminRole, { nullable: true })
  @prop({ required: true })
  type: AdminRole;

  @Field(() => Admin, { nullable: true })
  @prop({ ref: () => Admin, autopopulate: true, nullable: true, default: null })
  createdBy: Ref<Admin>;

  @Field(() => Date, { nullable: true })
  @prop()
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  @prop()
  updatedAt: Date;
}

export const AdminModel = getModelForClass(Admin, {
  schemaOptions: { timestamps: true },
});
