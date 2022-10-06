import {
  PaymentConfigEnum,
  PaymentConfigModel,
} from "../module/payment/schema/payment_config.schema";

export const GST_VAL = async (): Promise<number> => {
  const data = await PaymentConfigModel.findOne({
    type: PaymentConfigEnum.gst,
  })
    .select("value active")
    .lean();
  return data?.value && data.value > 0 && data.active ? data.value : 0;
};
