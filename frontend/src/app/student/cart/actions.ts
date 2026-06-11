"use server";

import { revalidatePath } from "next/cache";
import { requestBackendJson } from "@/lib/serverApi";

export async function checkoutCartAction(method: "mock" | "vnpay" = "mock") {
  if (method === "vnpay") {
    const result = await requestBackendJson("/payments/vnpay/create", {
      method: "POST",
    });

    return {
      ...result,
      redirectUrl: result?.data?.vnpayUrl || null,
      mode: "vnpay" as const,
    };
  }

  const paymentCreation = await requestBackendJson("/payments/create", {
    method: "POST",
    body: JSON.stringify({ method: "mock" }),
  });

  const paymentId = paymentCreation?.data?.payment?._id;

  if (!paymentId) {
    throw new Error("Khong tao duoc phien thanh toan");
  }

  const result = await requestBackendJson("/payments/mock-success", {
    method: "POST",
    body: JSON.stringify({ paymentId }),
  });

  revalidatePath("/student/cart");
  revalidatePath("/student/my-courses");
  revalidatePath("/student/dashboard");

  return {
    ...result,
    paymentId,
    redirectUrl: `/student/checkout/result?success=true&paymentId=${paymentId}&method=mock`,
    mode: "mock" as const,
  };
}
