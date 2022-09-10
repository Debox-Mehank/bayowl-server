import { Field, InputType } from "type-graphql";

@InputType()
export class PaymentInput {
  @Field(() => String, { nullable: false })
  email: string;

  @Field(() => String, { nullable: false })
  orderId: string;

  @Field(() => String, { nullable: true })
  paymentId: string;

  @Field(() => String, { nullable: true })
  signature: string;

  @Field(() => String, { nullable: false })
  userServiceId: string;

  @Field(() => Number, { nullable: false })
  amount: number;

  @Field(() => String, { nullable: true })
  status: string;
}
