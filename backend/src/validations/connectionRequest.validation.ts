import { z } from "zod";

export const connectionStatusValues = ["ignored", "interested", "accepted", "rejected"] as const;

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

export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;
