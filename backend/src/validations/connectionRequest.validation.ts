import { z } from "zod";

// ---------- Object sharing rule ----------
// All validation schemas below are .strict(), so unknown fields are rejected
// and only explicitly listed properties can appear in validated payloads.

// Statuses the SENDER is allowed to set when sending a connection request.
export const sendStatusValues = ["ignored", "interested"] as const;

export const sendStatusSchema = z.enum(sendStatusValues, {
  error: (issue) =>
    issue.input === undefined
      ? "Status is required"
      : `${issue.input} is incorrect status type`,
});

// Statuses the RECEIVER is allowed to set when reviewing a request they got.
export const reviewStatusValues = ["accepted", "rejected"] as const;

export const reviewStatusSchema = z.enum(reviewStatusValues, {
  error: (issue) =>
    issue.input === undefined
      ? "Status is required"
      : `${issue.input} is incorrect status type`,
});

// Every value allowed on the server, mirroring the DB's connection_status enum.
export const connectionStatusValues = [
  ...sendStatusValues,
  ...reviewStatusValues,
] as const;

export const connectionStatusSchema = z.enum(connectionStatusValues, {
  error: (issue) =>
    issue.input === undefined
      ? "Status is required"
      : `${issue.input} is incorrect status type`,
});

// Body for acting on a request the current user RECEIVED (accept/reject/ignore)
// or SENDING an interest. The action status is always validated with the same rule.
export const connectionRequestStatusSchema = z
  .object({
    status: connectionStatusSchema,
  })
  .strict();

export type SendStatus = z.infer<typeof sendStatusSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;
