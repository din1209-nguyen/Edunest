import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import connectDB from "../config/database.js";
import User from "../models/User.js";

const demoEmails = [
  "admin@edunest.local",
  "creator@edunest.local",
  "teacher@edunest.local",
  "user@edunest.local",
];

async function verifyDemoUsers() {
  try {
    await connectDB();

    const result = await User.updateMany(
      { email: { $in: demoEmails } },
      {
        $set: {
          isActive: true,
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiresAt: null,
        },
      },
    );

    console.log(`Verified ${result.modifiedCount} default account(s).`);
    console.log(`Matched ${result.matchedCount} default account(s).`);
  } catch (error) {
    console.error("Failed to verify default accounts:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

verifyDemoUsers();
