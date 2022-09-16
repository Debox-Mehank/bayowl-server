import AdminResolver from "../module/admin/resolver/admin.resolver";
import DashboardContentResolver from "../module/master/resolver/dashboard_content.resolver";
import PaymentResolver from "../module/payment/resolver/payment.resolver";
import ServicesResolver from "../module/services/resolver/services.resolver";
import UserResolver from "../module/user/resolver/user.resolver";

export const resolvers = [
  AdminResolver,
  UserResolver,
  ServicesResolver,
  PaymentResolver,
  DashboardContentResolver,
] as const;
