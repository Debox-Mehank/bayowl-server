import { InputType, Field } from "type-graphql";

@InputType()
export class AddOnInput {
  @Field(() => String, { nullable: false })
  type: string;

  @Field(() => Number, { nullable: true })
  value: number;

  @Field(() => Number, { nullable: true })
  qty: number;

  @Field(() => Boolean, { nullable: false })
  main: boolean;
}

@InputType()
export class ServicesInput {
  @Field(() => String, { nullable: false })
  mainCategory: string;

  @Field(() => String, { nullable: false })
  subCategory: string;

  @Field(() => String, { nullable: false })
  serviceName: string;

  @Field(() => String, { nullable: true })
  subService: string;

  @Field(() => String, { nullable: true })
  subService2: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => Number, {
    nullable: true,
  })
  estimatedTime: number;

  @Field(() => Number, { nullable: false })
  price: number;

  @Field(() => Number, { nullable: true })
  inputTrackLimit: number;

  @Field(() => [String], { description: "File formats for uploading file" })
  uploadFileFormat: string[];

  @Field(() => [String], { description: "File formats for delivery file" })
  deliveryFileFormat: string[];

  @Field(() => Number, { nullable: true })
  deliveryDays: number;

  @Field(() => Number, { nullable: true })
  maxFileDuration: number;

  @Field(() => Number, { nullable: true })
  numberOfReferenceFileUploads: number;

  @Field(() => Number, { nullable: true })
  setOfRevisions: number;

  @Field(() => Number, { nullable: true })
  revisionsDelivery: number;

  @Field(() => String, { nullable: true })
  mixVocalTuningBasic: string;

  @Field(() => String, { nullable: true })
  mixVocalTuningAdvanced: string;

  @Field(() => String, { nullable: true })
  mixProcessingReverbs: string;

  @Field(() => String, { nullable: true })
  mixProcessingDelays: string;

  @Field(() => String, { nullable: true })
  mixProcessingOtherFx: string;

  @Field(() => [AddOnInput], { nullable: false })
  addOn: AddOnInput[];
}

@InputType()
export class ServicesDetailInput {
  @Field(() => String, { nullable: false })
  mainCategory: string;

  @Field(() => String, { nullable: false })
  subCategory: string;

  @Field(() => String, { nullable: true })
  serviceName: string;
}
