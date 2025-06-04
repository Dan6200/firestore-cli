import { Options } from "commander";

export type WithoutServiceAccount = Omit<Options, "serviceAccount">;
export type WithoutBillingAccount = Omit<Options, "billingAccountId">;

export type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
};
