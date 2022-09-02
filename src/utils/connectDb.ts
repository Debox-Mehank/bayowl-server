import { mongoose } from "@typegoose/typegoose";

export async function connectToDb() {
  try {
    await mongoose.connect(process.env.DB_URI!);
    console.log("Connected To Database!");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
