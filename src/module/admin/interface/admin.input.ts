import { InputType, Field } from "type-graphql";
import { AdminRole } from "../schema/admin.schema";

@InputType()
export class AdminRegisterInput {
  @Field(() => String, { nullable: false })
  name: string;

  @Field(() => String, { nullable: false })
  email: string;

  @Field(() => String, { nullable: false })
  password: string;

  @Field(() => AdminRole)
  type: AdminRole;
}

@InputType()
export class AdminLoginInput {
  @Field(() => String, { nullable: false })
  email: string;

  @Field(() => String, { nullable: false })
  password: string;
}
