export type PaymentMode = "success" | "failure" | "random";

export interface PaymentResult {
  success: boolean;
  failureReason: string | null;
}

export const simulatePayment = (mode: PaymentMode): PaymentResult => {
  if (mode === "success") {
    return {
      success: true,
      failureReason: null
    };
  }

  if (mode === "failure") {
    return {
      success: false,
      failureReason: "Simulated payment failure"
    };
  }

  const success = Math.random() > 0.35;
  return {
    success,
    failureReason: success ? null : "Randomized payment decline"
  };
};

