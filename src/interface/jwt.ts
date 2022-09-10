import { Admin } from "../module/admin/schema/admin.schema";

export interface VerificationTokenType {
  email: string;
  id: string;
}

export interface TokenType {
  user: string;
  role: "user" | Admin["type"] | undefined;
  accountId: string;
}
