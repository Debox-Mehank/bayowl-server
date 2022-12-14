import { Field, ID, InputType } from "type-graphql";

@InputType()
export class DashboardContentInput {
  @Field(() => String, { nullable: false })
  image: string;
}
