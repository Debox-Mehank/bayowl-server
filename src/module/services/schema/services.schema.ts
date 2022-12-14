import {
  getModelForClass,
  ModelOptions,
  prop,
  Severity,
} from "@typegoose/typegoose";
import mongoose from "mongoose";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class AddOn {
  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  type: string;

  @Field(() => Number, { nullable: true })
  @prop({ default: null })
  value: number;

  @Field(() => Number, { nullable: true })
  @prop({ default: null })
  qty: number;

  @Field(() => Boolean, { nullable: false })
  @prop({ default: true })
  main: boolean;
}

@ObjectType()
@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
export class Services {
  @Field(() => ID)
  _id: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  mainCategory: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  subCategory: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true, trim: true })
  serviceName: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null, trim: true })
  subService: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null, trim: true })
  subService2: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null, trim: true })
  description: string;

  @Field(() => Number, {
    nullable: true,
  })
  @prop({ default: null })
  estimatedTime: number;

  @Field(() => Number, { nullable: false })
  @prop({ required: true })
  price: number;

  @Field(() => Number, { nullable: true })
  @prop({ default: null })
  inputTrackLimit: number;

  @Field(() => [String], { description: "File formats for uploading file" })
  @prop({ required: true, default: [], type: String })
  uploadFileFormat: mongoose.Types.Array<string>;

  @Field(() => [String], { description: "File formats for delivery file" })
  @prop({ required: true, default: [], type: String })
  deliveryFileFormat: mongoose.Types.Array<string>;

  @Field(() => Number, { nullable: true })
  @prop({ default: null })
  deliveryDays: number;

  @Field(() => Number, { nullable: true })
  @prop({ default: null })
  maxFileDuration: number;

  @Field(() => Number, { nullable: true })
  @prop({ default: null })
  numberOfReferenceFileUploads: number;

  @Field(() => Number, { nullable: true })
  @prop({ default: null })
  setOfRevisions: number;

  @Field(() => Number, { nullable: true })
  @prop({ default: null })
  revisionsDelivery: number;

  @Field(() => String, { nullable: true })
  @prop({ default: null, trim: true })
  mixVocalTuningBasic: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null, trim: true })
  mixVocalTuningAdvanced: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null, trim: true })
  mixProcessingReverbs: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null, trim: true })
  mixProcessingDelays: string;

  @Field(() => String, { nullable: true })
  @prop({ default: null, trim: true })
  mixProcessingOtherFx: string;

  @Field(() => [AddOn], { nullable: false })
  @prop({ default: [] })
  addOn: mongoose.Types.Array<AddOn>;

  @Field(() => Date, { nullable: true })
  @prop()
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  @prop()
  updatedAt: Date;
}

export const ServicesModel = getModelForClass(Services, {
  schemaOptions: { timestamps: true },
});
