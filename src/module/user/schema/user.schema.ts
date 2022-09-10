import { getModelForClass, prop, pre, index } from "@typegoose/typegoose";
import bcrypt from "bcrypt";
import { Field, ID, ObjectType } from "type-graphql";
import { mongoose } from "@typegoose/typegoose";
import { UserServices } from "../interface/user.interface";

@pre<User>("save", async function () {
  // check if password is being modified
  if (!this.isModified("password")) {
    return;
  }

  // hash password
  const salt = await bcrypt.genSalt(10);
  const hash = bcrypt.hashSync(this.password, salt);

  this.password = hash;
})
@index({ email: 1 })
@ObjectType()
export class User {
  @Field(() => ID)
  _id: string;

  @Field(() => String, { nullable: true })
  @prop({ trim: true })
  name: string;

  @Field(() => String)
  @prop({ required: true, trim: true, unique: true })
  email: string;

  @Field(() => String, { nullable: true })
  @prop({ trim: true, unique: true, default: null })
  number: string;

  @prop({ default: 0 })
  numberOfResetPassword: number;

  @prop({ trim: true, default: null })
  password: string;

  @Field(() => [UserServices], { nullable: false })
  @prop({
    type: UserServices,
    default: [],
  })
  services: mongoose.Types.Array<UserServices>;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  lastLoggedIn: Date;

  @Field(() => Date, { nullable: true })
  @prop({ default: null })
  lastLoggedOut: Date;

  //   @prop({ default: 0 })
  //   tokenVersion: number;

  @Field(() => Boolean)
  @prop({ default: false })
  accountVerified: boolean;

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const UserModel = getModelForClass(User, {
  schemaOptions: { timestamps: true },
});
