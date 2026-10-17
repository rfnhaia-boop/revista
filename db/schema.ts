import { pgTable, text, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
export const submissions = pgTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    area: text("area").notNull(),
    author: text("author").notNull(),
    summary: text("summary").notNull(),
    methodology: text("methodology").notNull(),
    references: text("references_text").notNull(),
    budgetCents: integer("budget_cents").notNull().default(0),
    status: text("status").notNull().default("received"),
    reviewNote: text("review_note").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("submissions_owner_created").on(t.ownerId, t.createdAt)],
);
export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  createdAt: text("created_at").notNull(),
});
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  headline: text("headline").notNull().default(""),
  location: text("location").notNull().default(""),
  bio: text("bio").notNull(),
  trajectory: text("trajectory").notNull().default(""),
  interests: text("interests").notNull(),
  link: text("link").notNull().default(""),
  showSupporters: integer("show_supporters").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
export const notebooks = pgTable(
  "notebooks",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    profileId: text("profile_id").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    format: text("format").notNull(),
    area: text("area").notNull(),
    access: text("access").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    status: text("status").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("notebooks_status_date").on(t.status, t.createdAt),
    index("notebooks_owner").on(t.ownerId),
  ],
);
export const follows = pgTable(
  "follows",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    profileId: text("profile_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("follows_profile").on(t.profileId)],
);
export const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  postId: text("post_id").notNull(),
  createdAt: text("created_at").notNull(),
});
export const knowledgeProjects = pgTable(
  "knowledge_projects",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    profileId: text("profile_id").notNull(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    kind: text("kind").notNull(),
    area: text("area").notNull(),
    problem: text("problem").notNull(),
    justification: text("justification").notNull(),
    expectedResult: text("expected_result").notNull(),
    stage: text("stage").notNull(),
    goalCents: integer("goal_cents").notNull(),
    budget: text("budget").notNull(),
    timeline: text("timeline").notNull(),
    team: text("team").notNull(),
    risks: text("risks").notNull(),
    status: text("status").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("projects_status_date").on(t.status, t.createdAt),
    index("projects_owner").on(t.ownerId),
  ],
);
export const projectUpdates = pgTable(
  "project_updates",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("project_updates_project").on(t.projectId, t.createdAt)],
);
export const memberAccounts = pgTable("member_accounts", {
  ownerId: text("owner_id").primaryKey(),
  role: text("role").notNull().default("member"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const roleRequests = pgTable(
  "role_requests",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    requestedRole: text("requested_role").notNull(),
    presentation: text("presentation").notNull(),
    experience: text("experience").notNull(),
    portfolio: text("portfolio").notNull().default(""),
    motivation: text("motivation").notNull(),
    status: text("status").notNull().default("submitted"),
    reviewNote: text("review_note").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("role_requests_owner").on(t.ownerId, t.createdAt),
    index("role_requests_status").on(t.status, t.createdAt),
  ],
);
export const creatorInvitations = pgTable("creator_invitations", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  invitedName: text("invited_name").notNull().default(""),
  message: text("message").notNull().default(""),
  tokenHash: text("token_hash").notNull().unique(),
  role: text("role").notNull(),
  status: text("status").notNull().default("open"),
  expiresAt: text("expires_at").notNull(),
  acceptedBy: text("accepted_by"),
  createdAt: text("created_at").notNull(),
});
export const communityQuestions = pgTable(
  "community_questions",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    context: text("context").notNull(),
    importance: text("importance").notNull(),
    status: text("status").notNull().default("submitted"),
    reviewNote: text("review_note").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("questions_owner").on(t.ownerId, t.createdAt),
    index("questions_status").on(t.status, t.createdAt),
  ],
);
export const projectRounds = pgTable(
  "project_rounds",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    ownerId: text("owner_id").notNull(),
    roundNumber: integer("round_number").notNull(),
    title: text("title").notNull(),
    fundingModel: text("funding_model").notNull(),
    minimumCents: integer("minimum_cents").notNull(),
    targetCents: integer("target_cents").notNull(),
    maximumCents: integer("maximum_cents").notNull(),
    purpose: text("purpose").notNull(),
    deliverables: text("deliverables").notNull(),
    status: text("status").notNull().default("draft"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("rounds_project").on(t.projectId, t.roundNumber),
    index("rounds_owner").on(t.ownerId),
  ],
);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("sessions_user").on(t.userId)],
);

export const articles = pgTable(
  "articles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    area: text("area").notNull(),
    kind: text("kind").notNull(),
    authorName: text("author_name").notNull(),
    readingMinutes: integer("reading_minutes").notNull().default(5),
    kicker: text("kicker").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    body: text("body").notNull(),
    pullquote: text("pullquote").notNull().default(""),
    referencesText: text("references_text").notNull().default(""),
    statusNote: text("status_note").notNull().default("Não revisado por pares."),
    versionNote: text("version_note").notNull().default(""),
    status: text("status").notNull().default("draft"),
    authorId: text("author_id"),
    reviewNote: text("review_note").notNull().default(""),
    submittedAt: text("submitted_at"),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("articles_status_pub").on(t.status, t.publishedAt),
    index("articles_author").on(t.authorId),
  ],
);

// Engajamento do Caderno: leituras (anônimas, 1 por leitor/dia), respostas e "Isso me ajudou".
export const notebookViews = pgTable(
  "notebook_views",
  {
    id: text("id").primaryKey(),
    postId: text("post_id").notNull(),
    viewerKey: text("viewer_key").notNull(),
    day: text("day").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("notebook_views_post_day").on(t.postId, t.day)],
);
export const notebookReplies = pgTable(
  "notebook_replies",
  {
    id: text("id").primaryKey(),
    postId: text("post_id").notNull(),
    ownerId: text("owner_id").notNull(),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("visible"),
    seenAt: text("seen_at"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("notebook_replies_post").on(t.postId, t.createdAt)],
);
export const notebookReactions = pgTable(
  "notebook_reactions",
  {
    id: text("id").primaryKey(),
    postId: text("post_id").notNull(),
    ownerId: text("owner_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("notebook_reactions_post").on(t.postId)],
);

export const payoutAccounts = pgTable("payout_accounts", {
  ownerId: text("owner_id").primaryKey(),
  provider: text("provider").notNull().default("asaas"),
  providerAccountId: text("provider_account_id").notNull().default(""),
  walletId: text("wallet_id").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const plans = pgTable(
  "plans",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
    interval: text("interval").notNull().default("monthly"),
    active: integer("active").notNull().default(1),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("plans_owner").on(t.ownerId)],
);
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    readerOwnerId: text("reader_owner_id").notNull(),
    creatorOwnerId: text("creator_owner_id").notNull(),
    planId: text("plan_id").notNull(),
    providerSubscriptionId: text("provider_subscription_id").unique(),
    status: text("status").notNull().default("pending"),
    currentPeriodEnd: text("current_period_end"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("subscriptions_reader").on(t.readerOwnerId), index("subscriptions_creator").on(t.creatorOwnerId)],
);
export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    providerPaymentId: text("provider_payment_id").notNull().unique(),
    payerOwnerId: text("payer_owner_id").notNull(),
    creatorOwnerId: text("creator_owner_id").notNull(),
    kind: text("kind").notNull(),
    notebookId: text("notebook_id"),
    subscriptionId: text("subscription_id"),
    amountCents: integer("amount_cents").notNull(),
    commissionCents: integer("commission_cents").notNull().default(0),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("payments_payer").on(t.payerOwnerId)],
);
export const entitlements = pgTable(
  "entitlements",
  {
    id: text("id").primaryKey(),
    readerOwnerId: text("reader_owner_id").notNull(),
    creatorOwnerId: text("creator_owner_id").notNull(),
    kind: text("kind").notNull(),
    notebookId: text("notebook_id"),
    paymentId: text("payment_id").notNull(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at"),
    status: text("status").notNull().default("active"),
  },
  (t) => [index("entitlements_reader").on(t.readerOwnerId, t.status), uniqueIndex("entitlements_payment_unique").on(t.paymentId)],
);
export const webhookEvents = pgTable("webhook_events", {
  eventId: text("event_id").primaryKey(),
  provider: text("provider").notNull(),
  event: text("event").notNull(),
  payload: text("payload").notNull(),
  receivedAt: text("received_at").notNull(),
  processedAt: text("processed_at"),
});
export const paymentCustomers = pgTable("payment_customers", {
  ownerId: text("owner_id").primaryKey(),
  providerCustomerId: text("provider_customer_id").notNull(),
  createdAt: text("created_at").notNull(),
});
export const termsAcceptances = pgTable(
  "terms_acceptances",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    version: text("version").notNull(),
    source: text("source").notNull(),
    acceptedAt: text("accepted_at").notNull(),
  },
  (t) => [index("terms_acceptances_owner").on(t.ownerId, t.version)],
);
