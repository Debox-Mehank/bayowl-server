import nodemailer, { SendMailOptions } from "nodemailer";
import hbs, {
  HbsTransporter,
  NodemailerExpressHandlebarsOptions,
  TemplateOptions,
} from "nodemailer-express-handlebars";
import path from "path";
import { signJwt } from "../utils/auth";

const MASTER_MAIL = process.env.MASTER_MAIL;
const MANAGER_MAIL = process.env.MANAGER_MAIL;
const APP_URL = process.env.APP_URL;

export const transporter: HbsTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

export const hbsOptions: NodemailerExpressHandlebarsOptions = {
  extName: ".hbs",
  viewEngine: {
    extname: ".html",
    partialsDir: path.join(__dirname, "templates"),
    defaultLayout: false,
  },
  viewPath: path.join(__dirname, "templates"),
};

transporter.use("compile", hbs(hbsOptions));

const SUBJECT = "Bay Owl Online Studio - ";

export const sendUserVerificationEmail = async ({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) => {
  const appUrl = process.env.APP_URL!;

  const token = signJwt({ id: userId }, { expiresIn: "1d" });

  const verificationLink = `${appUrl}/email-verification?userId=${userId}&token=${token}`;

  const mailOptions: SendMailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: SUBJECT + "Verify Your Email!",
    html: `<p style="white-space: pre-line;">Click on the link to verify your email id.</p><p>This link will <b>expire in 60 minutes.</b></p><a href='${verificationLink}' target='_blank'>Click Here</a>`,
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in sending verification mail: " + error);
  }
};

export const sendUserCreateAccountMail = async ({
  email,
  userId,
}: {
  email: string;
  userId: string;
}) => {
  const appUrl = process.env.APP_URL!;

  const token = signJwt({ id: userId }, { expiresIn: "1d" });

  const verificationLink = `${appUrl}/complete-account?email=${email}&token=${token}`;

  const mailOptions: SendMailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: SUBJECT + "Create your account",
    html: `<a href=${verificationLink}>Click here</a>`,
  };
  try {
    await transporter.sendMail(mailOptions);
    return verificationLink;
  } catch (error) {
    console.log("Error in sending create account mail: " + error);
  }
};

export const sendResetPasswordLink = async (email: string, userId: string) => {
  const appUrl = process.env.APP_URL!;

  const token = signJwt({ id: userId }, { expiresIn: "1h" });

  const resetPasswordLink = `${appUrl}/reset-password?userId=${userId}&token=${token}`;

  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: SUBJECT + "Reset Your Password!",
    html: `<p style="white-space: pre-line;">Click on the link to reset your password.</p><p>This link will <b>expire in 60 minutes.</b></p><a href='${resetPasswordLink}' target='_blank'>Click Here</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Mail sending error: " + error);
  }
};

export const servicePurchaseMail = async (
  email: string,
  customer: string,
  service: string,
  amount: number
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-purchase-customer",
    subject: SUBJECT + "Service Purchased",
    context: {
      customer: customer,
      service: service,
      amount: amount.toLocaleString("en-IN"),
      website: APP_URL,
    },
  };
  const mailOptionsAdmin: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-purchase-admin",
    subject: SUBJECT + "Service Purchased",
    context: {
      customer: customer,
      service: service,
      amount: amount.toLocaleString("en-IN"),
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptionsAdmin);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceAssignmentInternal = async (
  email: string,
  customer: string,
  service: string,
  engineer: string,
  project: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-assignment-internal",
    subject: SUBJECT + "Service Assigned",
    context: {
      customer: customer,
      service: service,
      engineer: engineer,
      project: project,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceReviewAcceptance = async (
  email: string,
  customer: string,
  engineer: string,
  project: string,
  service: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-accepted-customer",
    subject: SUBJECT + "Service Accepted",
    context: {
      customer: customer,
      project: project,
      service: service,
      website: APP_URL,
    },
  };

  const mailOptions1: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-accepted-admin",
    subject: SUBJECT + "Service Accepted",
    context: {
      customer: customer,
      project: project,
      engineer: engineer,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions1);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceReuploadRequest = async (
  email: string,
  customer: string,
  engineer: string,
  project: string,
  notes: string,
  service: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-reupload-requested-customer",
    subject: SUBJECT + "Service Reupload Requested",
    context: {
      customer: customer,
      project: project,
      notes: notes,
    },
  };

  const mailOptions1: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-reupload-requested-admin",
    subject: SUBJECT + "Service Reupload Requested",
    context: {
      customer: customer,
      project: project,
      engineer: engineer,
      service: service,
      notes: notes,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions1);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceReuploaded = async (
  email: string,
  customer: string,
  engineer: string,
  project: string,
  service: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-file-reupload-internal",
    subject: SUBJECT + "Service Files Reuploaded",
    context: {
      engineer: engineer,
      customer: customer,
      service: service,
      project: project,
    },
  };

  const mailOptions1: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-file-reupload-admin",
    subject: SUBJECT + "Service Files Reuploaded",
    context: {
      customer: customer,
      project: project,
      service: service,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions1);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceQACheck = async (
  customer: string,
  engineer: string,
  project: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-qa-check",
    subject: SUBJECT + "Service QA Check",
    context: {
      engineer: engineer,
      customer: customer,
      project: project,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceQAReject = async (
  email: string,
  customer: string,
  engineer: string,
  project: string,
  service: string,
  notes: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-qa-rejected",
    subject: SUBJECT + "Service QA Rejection",
    context: {
      engineer: engineer,
      customer: customer,
      project: project,
      service: service,
      notes: notes,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const internalRevisionSubmission = async (
  customer: string,
  engineer: string,
  project: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-internal-rework",
    subject: SUBJECT + "Service Internal Submission",
    context: {
      engineer: engineer,
      customer: customer,
      project: project,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceDelivery = async (
  email: string,
  customer: string,
  project: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-delivery",
    subject: SUBJECT + "Service Delivery",
    context: {
      customer: customer,
      project: project,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceRevisionRequest = async (
  email: string,
  customer: string,
  engineer: string,
  project: string,
  service: string,
  notes: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-revision-request-internal",
    subject: SUBJECT + "Service Revision Requested",
    context: {
      engineer: engineer,
      customer: customer,
      service: service,
      project: project,
      notes: notes,
    },
  };

  const mailOptions1: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-revision-request-admin",
    subject: SUBJECT + "Service Revision Requested",
    context: {
      engineer: engineer,
      customer: customer,
      service: service,
      project: project,
      notes: notes,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions1);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceRevisionDelivery = async (
  email: string,
  customer: string,
  project: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-revision-delivery-customer",
    subject: SUBJECT + "Service Revision Completed",
    context: {
      customer: customer,
      project: project,
    },
  };

  const mailOptions1: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-revision-delivery-admin",
    subject: SUBJECT + "Service Revision Completed",
    context: {
      customer: customer,
      project: project,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions1);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const serviceCompletion = async (
  email: string,
  customer: string,
  engineer: string,
  project: string,
  notes: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-completion-internal",
    subject: SUBJECT + "Service Completed",
    context: {
      engineer: engineer,
      customer: customer,
      project: project,
      notes: notes,
    },
  };

  const mailOptions1: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-completion-admin",
    subject: SUBJECT + "Service Completed",
    context: {
      engineer: engineer,
      customer: customer,
      project: project,
      notes: notes,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions1);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const addonRequest = async (
  email: string,
  customer: string,
  engineer: string,
  project: string,
  service: string,
  notes: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-addon-request-internal",
    subject: SUBJECT + "Service Add-on Requested",
    context: {
      engineer: engineer,
      customer: customer,
      service: service,
      project: project,
      notes: notes,
    },
  };

  const mailOptions1: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-addon-request-admin",
    subject: SUBJECT + "Service Add-on Requested",
    context: {
      customer: customer,
      service: service,
      project: project,
      notes: notes,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions1);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const addonDelivery = async (
  email: string,
  customer: string,
  project: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-addon-delivery-customer",
    subject: SUBJECT + "Service Add-on Delivered",
    context: {
      customer: customer,
      project: project,
    },
  };

  const mailOptions1: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-addon-delivery-admin",
    subject: SUBJECT + "Service Add-on Delivered",
    context: {
      customer: customer,
      project: project,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptions1);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const addOnPurchase = async (
  email: string,
  customer: string,
  service: string,
  amount: number
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    template: "service-addon-purchase-customer",
    subject: SUBJECT + "Add-on Purchased",
    context: {
      customer: customer,
      service: service,
      amount: amount.toLocaleString("en-IN"),
    },
  };
  const mailOptionsAdmin: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "service-addon-purchase-admin",
    subject: SUBJECT + "Add-on Purchased",
    context: {
      customer: customer,
      service: service,
      amount: amount.toLocaleString("en-IN"),
    },
  };
  try {
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(mailOptionsAdmin);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};

export const sendEnquiryMail = async (
  email: string,
  phone: string,
  message: string,
  fullname: string
) => {
  const mailOptions: SendMailOptions | TemplateOptions = {
    from: process.env.AUTH_EMAIL,
    to: MASTER_MAIL,
    cc: MANAGER_MAIL,
    template: "contact-enquiry",
    subject: SUBJECT + "New Contact Form Enquiry",
    context: {
      email: email,
      phone: phone,
      message: message,
      fullname: fullname,
    },
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in sending mail: " + error);
  }
};
