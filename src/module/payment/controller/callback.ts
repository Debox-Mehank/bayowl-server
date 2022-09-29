import crypto from "crypto";
import { Request, Response } from "express";
import { addToCommunicationsQueue } from "../../../bull";
import { EmailTriggerTypeEnum } from "../../../interface/bull";
import { sendUserCreateAccountMail } from "../../../mails";
import { AdminModel } from "../../admin/schema/admin.schema";
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

    const usersevice = await UserModel.findOne({
      "services._id": pm?.userServiceId,
    }).select("services name");

    const service = usersevice?.services?.find(
      (el) => String(el._id) === pm?.userServiceId
    );

    if (!service || !usersevice) {
      res.status(400).json({
        success: false,
      });
      return;
    }

    await addToCommunicationsQueue({
      type: EmailTriggerTypeEnum.servicepurchase,
      email: pm?.email ?? "",
      amount: service.price,
      customer: usersevice.name,
      service: service.subService ? service.subService : service.serviceName,
    });

    res.redirect(`${process.env.APP_URL}/payment-success`);
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

export const paymentCallbackHandlerAddonMultitrack = async (
  req: Request,
  res: Response
) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

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

    const usersevice = await UserModel.findOne({
      "services._id": pm?.userServiceId,
    }).select("services name");

    const service = usersevice?.services?.find(
      (el) => String(el._id) === pm?.userServiceId
    );

    if (!service || !usersevice) {
      res.status(400).json({
        success: false,
      });
      return;
    }

    const internalAdmin = await AdminModel.findOne({
      _id: service.assignedTo,
    })
      .lean()
      .select("name email");

    await addToCommunicationsQueue({
      email: internalAdmin?.email ?? "",
      service: service.subService ? service.subService : service.serviceName,
      type: EmailTriggerTypeEnum.serviceaddonrequest,
      customer: usersevice?.name ?? "",
      engineer: internalAdmin?.name ?? "",
      project: service.projectName,
      notes: "Additional Exports: Multitracks",
    });

    await addToCommunicationsQueue({
      type: EmailTriggerTypeEnum.serviceaddonpurchase,
      email: pm?.email ?? "",
      amount: pm?.amount,
      customer: usersevice.name,
      service: "Additional Exports: Multitracks",
    });

    await UserModel.updateOne(
      {
        email: pm?.email,
        services: {
          $elemMatch: {
            _id: pm?.userServiceId,
          },
        },
      },
      { $set: { "services.$.addOnExportsMultitrack": true } }
    );

    res.redirect(`${process.env.APP_URL}/service-tracking`);
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

export const paymentCallbackHandlerAddonStems = async (
  req: Request,
  res: Response
) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

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

    const usersevice = await UserModel.findOne({
      "services._id": pm?.userServiceId,
    }).select("services name");

    const service = usersevice?.services?.find(
      (el) => String(el._id) === pm?.userServiceId
    );

    if (!service || !usersevice) {
      res.status(400).json({
        success: false,
      });
      return;
    }

    const internalAdmin = await AdminModel.findOne({
      _id: service.assignedTo,
    })
      .lean()
      .select("name email");

    await addToCommunicationsQueue({
      email: internalAdmin?.email ?? "",
      service: service.subService ? service.subService : service.serviceName,
      type: EmailTriggerTypeEnum.serviceaddonrequest,
      customer: usersevice?.name ?? "",
      engineer: internalAdmin?.name ?? "",
      project: service.projectName,
      notes: "Additional Exports: Bus Stems",
    });

    await addToCommunicationsQueue({
      type: EmailTriggerTypeEnum.serviceaddonpurchase,
      email: pm?.email ?? "",
      amount: pm?.amount,
      customer: usersevice.name,
      service: "Additional Exports: Bus Stems",
    });

    await UserModel.updateOne(
      {
        email: pm?.email,
        services: {
          $elemMatch: {
            _id: pm?.userServiceId,
          },
        },
      },
      { $set: { "services.$.addOnExportsBusStems": true } }
    );

    res.redirect(`${process.env.APP_URL}/service-tracking`);
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

export const paymentCallbackHandlerAddonBoth = async (
  req: Request,
  res: Response
) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

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

    const usersevice = await UserModel.findOne({
      "services._id": pm?.userServiceId,
    }).select("services name");

    const service = usersevice?.services?.find(
      (el) => String(el._id) === pm?.userServiceId
    );

    if (!service || !usersevice) {
      res.status(400).json({
        success: false,
      });
      return;
    }

    const internalAdmin = await AdminModel.findOne({
      _id: service.assignedTo,
    })
      .lean()
      .select("name email");

    await addToCommunicationsQueue({
      email: internalAdmin?.email ?? "",
      service: service.subService ? service.subService : service.serviceName,
      type: EmailTriggerTypeEnum.serviceaddonrequest,
      customer: usersevice?.name ?? "",
      engineer: internalAdmin?.name ?? "",
      project: service.projectName,
      notes: "Additional Exports: Multitracks, Additional Exports: Bus Stems",
    });

    await addToCommunicationsQueue({
      type: EmailTriggerTypeEnum.serviceaddonpurchase,
      email: pm?.email ?? "",
      amount: pm?.amount,
      customer: usersevice.name,
      service: "Additional Exports: Multitracks, Additional Exports: Bus Stems",
    });

    await UserModel.updateOne(
      {
        email: pm?.email,
        services: {
          $elemMatch: {
            _id: pm?.userServiceId,
          },
        },
      },
      {
        $set: {
          "services.$.addOnExportsBusStems": true,
          "services.$.addOnExportsMultitrack": true,
        },
      }
    );

    res.redirect(`${process.env.APP_URL}/service-tracking`);
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

export const paymentCallbackHandlerAddonRevision = async (
  req: Request,
  res: Response
) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

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

    const usersevice = await UserModel.findOne({
      "services._id": pm?.userServiceId,
    }).select("services name");

    const service = usersevice?.services?.find(
      (el) => String(el._id) === pm?.userServiceId
    );

    if (!service || !usersevice) {
      res.status(400).json({
        success: false,
      });
      return;
    }

    const internalAdmin = await AdminModel.findOne({
      _id: service.assignedTo,
    })
      .lean()
      .select("name email");

    await addToCommunicationsQueue({
      email: internalAdmin?.email ?? "",
      service: service.subService ? service.subService : service.serviceName,
      type: EmailTriggerTypeEnum.serviceaddonrequest,
      customer: usersevice?.name ?? "",
      engineer: internalAdmin?.name ?? "",
      project: service.projectName,
      notes: "Extra Revision",
    });

    await addToCommunicationsQueue({
      type: EmailTriggerTypeEnum.serviceaddonpurchase,
      email: pm?.email ?? "",
      amount: pm?.amount,
      customer: usersevice.name,
      service: "Extra Revision",
    });

    await UserModel.updateOne(
      {
        email: pm?.email,
        services: {
          $elemMatch: {
            _id: pm?.userServiceId,
          },
        },
      },
      {
        $set: { "services.$.addOnExtraRevision": true },
        $inc: {
          "services.$.setOfRevisions": 1,
        },
      }
    );

    res.redirect(`${process.env.APP_URL}/service-tracking`);
  } else {
    res.status(400).json({
      success: false,
    });
  }
};
