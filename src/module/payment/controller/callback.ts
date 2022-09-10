import crypto from "crypto";
import { Request, Response } from "express";
import { sendUserCreateAccountMail } from "../../../mails";
import { UserModel } from "../../user/schema/user.schema";
import { PaymentModel } from "../schema/payment.schema";

export const paymentLinkCallbackHandler = async (
  req: Request,
  res: Response
) => {
  const {
    razorpay_payment_id,
    razorpay_payment_link_id,
    razorpay_payment_link_reference_id,
    razorpay_payment_link_status,
    razorpay_signature,
  } = req.query;

  const body =
    razorpay_payment_link_id +
    "|" +
    razorpay_payment_link_reference_id +
    "|" +
    razorpay_payment_link_status +
    "|" +
    razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    const pm = await PaymentModel.findOneAndUpdate(
      {
        paymentLinkId: razorpay_payment_link_id,
      },
      {
        $set: {
          paymentId: razorpay_payment_id,
          status: razorpay_payment_link_status,
          signature: razorpay_signature,
        },
      },
      { new: true }
    );

    const upd = await UserModel.findOneAndUpdate(
      {
        email: pm?.email,
        services: {
          $elemMatch: {
            _id: pm?.userServiceId,
          },
        },
      },
      { $set: { "services.$.paid": true } },
      { new: true }
    );

    const vl = await sendUserCreateAccountMail({
      email: upd?.email ?? "",
      userId: upd?._id ?? "",
    });

    res.redirect(`${vl}`);
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

export const paymentCallbackHandler = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  console.log(body);

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    const pm = await PaymentModel.findOneAndUpdate(
      {
        orderId: razorpay_order_id,
      },
      {
        $set: {
          paymentId: razorpay_payment_id,
          status: "paid",
          signature: razorpay_signature,
        },
      },
      { new: true }
    );

    await UserModel.updateOne(
      {
        email: pm?.email,
        services: {
          $elemMatch: {
            _id: pm?.userServiceId,
          },
        },
      },
      { $set: { "services.$.paid": true } }
    );

    res.redirect(`${process.env.APP_URL}/dashboard`);
  } else {
    res.status(400).json({
      success: false,
    });
  }
};
