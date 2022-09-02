import { InputType, Field } from "type-graphql";

@InputType()
class AddOnInput {
  @Field(() => String, { nullable: false })
  type: string;

  @Field(() => Number, { nullable: false })
  value: number;
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

  @Field(() => Number, { nullable: false })
  estimatedTime: number;

  @Field(() => Number, { nullable: false })
  price: number;

  @Field(() => Number, { nullable: false })
  inputLimit: number;

  @Field(() => String, { nullable: false })
  fileFormat: string;

  @Field(() => String, { nullable: false })
  deliveryFormat: string;

  @Field(() => Number, { nullable: false })
  deliveryDays: number;

  @Field(() => Number, { nullable: false })
  maxDuration: number;

  @Field(() => Number, { nullable: false })
  numberOfReferenceFileUploads: number;

  @Field(() => Number, { nullable: false })
  setOfRevisions: number;

  @Field(() => Number, { nullable: false })
  revisionsDelivery: number;

  @Field(() => String, { nullable: false })
  mixVocalTuning: string;

  @Field(() => String, { nullable: false })
  mixProcessingReverbs: string;

  @Field(() => String, { nullable: false })
  mixProcessingDelays: string;

  @Field(() => String, { nullable: false })
  mixProcessingOtherFx: string;

  @Field(() => [AddOnInput], { nullable: false })
  addOn: AddOnInput[];
}
