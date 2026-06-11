import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createTestApp } from "./app.js";
import { setApp } from "../helpers/testHelper.js";

let mongoServer;
let testContext;

export async function initTestApp() {
  process.env.SMTP_USER = process.env.SMTP_USER || "test-smtp-user";
  process.env.SMTP_PASS = process.env.SMTP_PASS || "test-smtp-pass";
  process.env.SMTP_FROM = process.env.SMTP_FROM || "Edunest <test@example.com>";
  process.env.EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "smtp";

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
  testContext = createTestApp();
  setApp(testContext.app);

  return testContext.app;
}

export async function resetDatabase() {
  if (mongoose.connection.readyState !== 1) return;

  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function closeTestApp() {
  if (testContext?.io) {
    await new Promise((resolve) => {
      testContext.io.close(() => resolve(undefined));
    });
  }

  if (testContext?.server?.listening) {
    await new Promise((resolve, reject) => {
      testContext.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(undefined);
      });
    });
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }

  mongoServer = undefined;
  testContext = undefined;
}
