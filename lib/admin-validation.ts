import { z } from "zod";

const note = z.string().trim().max(1000).default("");
const id = z.string().uuid();

export const requestDecisionSchema = z
  .object({ id, decision: z.enum(["approve", "reviewing", "changes", "reject"]), note })
  .strict();

export const inviteSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("create"),
      email: z.string().trim().toLowerCase().email().max(200),
      invitedName: z.string().trim().min(2).max(100),
      message: z.string().trim().max(500).default(""),
      role: z.enum(["creator", "researcher"]),
    })
    .strict(),
  z.object({ action: z.literal("revoke"), id }).strict(),
]);

export const questionDecisionSchema = z
  .object({
    id,
    status: z.enum(["reviewing", "changes_requested", "published", "selected", "rejected"]),
    note,
  })
  .strict();

export const submissionDecisionSchema = z
  .object({
    id,
    status: z.enum(["received", "reviewing", "changes_requested", "accepted", "rejected"]),
    note,
  })
  .strict();

export const articleSchema = z
  .object({
    id: id.optional(),
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(120),
    title: z.string().trim().min(5).max(200),
    summary: z.string().trim().min(20).max(500),
    area: z.string().trim().min(2).max(60),
    kind: z.string().trim().min(3).max(80),
    authorName: z.string().trim().min(2).max(120),
    readingMinutes: z.number().int().min(1).max(120),
    kicker: z.string().trim().max(40),
    sortOrder: z.number().int().min(0).max(999),
    body: z.string().trim().min(40).max(60000),
    pullquote: z.string().trim().max(300),
    referencesText: z.string().trim().max(4000),
    statusNote: z.string().trim().min(2).max(200),
    versionNote: z.string().trim().max(300),
    status: z.enum(["draft", "published"]),
  })
  .strict();

export const userRoleSchema = z
  .object({ userId: z.string().min(1).max(100), role: z.enum(["member", "creator", "researcher", "editorial", "admin"]) })
  .strict();

export const articleReviewSchema = z
  .object({
    id,
    decision: z.enum(["reviewing", "changes", "reject", "publish"]),
    note,
  })
  .strict();

export const thoughtModerationSchema = z
  .object({ id, hidden: z.boolean(), note })
  .strict();
