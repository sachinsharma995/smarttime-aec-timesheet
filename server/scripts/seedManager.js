import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const manager = {
  name: "SmartTime Manager",
  email: process.env.MANAGER_EMAIL,
  password: process.env.MANAGER_PASSWORD,
  role: "manager",
};

const seedManager = async () => {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("The demo manager seed can only run in development.");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existingUser = await User.findOne({ email: manager.email });

  if (existingUser) {
    if (existingUser.role !== "manager") {
      throw new Error(
        `Cannot create demo manager: ${manager.email} is already an ${existingUser.role} account.`,
      );
    }

    console.log("Demo manager account already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash(manager.password, 10);
  await User.create({
    name: manager.name,
    email: manager.email,
    password: hashedPassword,
    role: manager.role,
  });

  console.log("Demo manager account created.");
};

seedManager()
  .catch((error) => {
    console.error(`Unable to seed demo manager: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
