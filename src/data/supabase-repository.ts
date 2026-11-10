/**
 * Repositório real do netclub.app sobre o Supabase exclusivo do aplicativo.
 *
 * Regras:
 *  - o cliente usa apenas a chave publishable;
 *  - todo acesso passa por RLS (o banco é a última linha de defesa);
 *  - operações privilegiadas usam funções SQL `security definer`
 *    (`start_conversation`, `create_collaboration`, `block_user`);
 *  - cotações e notícias continuam vazias: não há provedor contratado, então a
 *    UI mostra "indisponível" em vez de inventar números.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseClient } from "./supabase-client";
import {
  RepositoryError,
  type MatchState,
  type NetclubRepository,
  type OnboardingInput,
  type ProfileUpdateInput,
  type PromotionInput,
  type ReportInput,
  type SavedSearchInput,
  type SignUpInput,
  type SignUpResult,
  type UploadKind,
} from "./repository";
import {
  FREE_NETMACH_DAILY_LIMIT,
  type Block,
  type Club,
  type ClubCategory,
  type Collaboration,
  type Comment,
  type Connection,
  type Conversation,
  type DeletionRequest,
  type Experience,
  type GoalId,
  type Language,
  type MarketQuote,
  type MatchInterest,
  type Message,
  type NetclubDb,
  type NewsItem,
  type Notification,
  type NotificationKind,
  type OfficialAnnouncement,
  type Post,
  type Profile,
  type Promotion,
  type Recommendation,
  type Report,
  type ReportTarget,
  type SavedSearch,
  type SkillId,
  type Story,
  type Subscription,
  type TermsAcceptance,
  type UserSettings,
} from "./types";

type Row = any;

const DEFAULT_SETTINGS: UserSettings = {
  language: "pt-BR",
  profileVisibility: "members",
  showGoals: true,
  allowMessagesFrom: "connections",
  emailNotifications: true,
};

const BUCKETS: Record<UploadKind, string> = {
  avatar: "avatars",
  portfolio: "portfolio",
  story: "stories",
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function strings<T extends string>(value: unknown): T[] {
  return Array.isArray(value) ? value.filter((item): item is T => typeof item === "string") : [];
}

function mapProfile(row: Row): Profile {
  return {
    id: row.id,
    username: row.username ?? "",
    fullName: row.full_name ?? "",
    headline: row.headline ?? "",
    area: row.area ?? "",
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? null,
    location: row.location ?? "",
    country: row.country ?? "",
    experience: (row.experience ?? "beginner") as Experience,
    skills: strings<SkillId>(row.skills),
    interests: strings<SkillId>(row.interests),
    goals: strings<GoalId>(row.goals),
    lookingFor: row.looking_for ?? "",
    offering: row.offering ?? "",
    portfolio: Array.isArray(row.portfolio) ? row.portfolio : [],
    links: Array.isArray(row.links) ? row.links : [],
    onboarded: Boolean(row.onboarded),
    role: row.role === "admin" ? "admin" : "member",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapPost(row: Row): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    content: row.content ?? "",
    createdAt: row.created_at,
    likedBy: (row.post_likes ?? []).map((like: Row) => like.user_id),
    savedBy: (row.post_saves ?? []).map((save: Row) => save.user_id),
    clubId: row.club_id ?? null,
    sponsored: Boolean(row.sponsored),
    hidden: Boolean(row.hidden),
  };
}

function mapComment(row: Row): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    content: row.content ?? "",
    createdAt: row.created_at,
    parentId: row.parent_id ?? null,
  };
}

function mapStory(row: Row): Story {
  return {
    id: row.id,
    authorId: row.author_id,
    imageUrl: row.image_url ?? null,
    text: row.text ?? "",
    background: row.background || "linear-gradient(135deg, #123c33, #1f6f5c)",
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    viewedBy: (row.story_views ?? []).map((view: Row) => view.user_id),
    sponsored: Boolean(row.sponsored),
  };
}

function mapConnection(row: Row): Connection {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
    status: row.status === "accepted" ? "accepted" : "pending",
    createdAt: row.created_at,
  };
}

function mapConversation(row: Row): Conversation {
  return {
    id: row.id,
    memberIds: (row.conversation_members ?? []).map((member: Row) => member.user_id),
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: Row): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content ?? "",
    createdAt: row.created_at,
    readBy: (row.message_reads ?? []).map((read: Row) => read.user_id),
  };
}

function mapClub(row: Row): Club {
  const members: Row[] = row.club_members ?? [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    category: row.category as ClubCategory,
    coverUrl: row.cover_url ?? null,
    adminIds: members.filter((member) => member.role === "admin").map((member) => member.user_id),
    memberIds: members.map((member) => member.user_id),
    rules: Array.isArray(row.rules) ? row.rules : [],
    createdAt: row.created_at,
  };
}

function mapNotification(row: Row): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id ?? null,
    kind: row.kind as NotificationKind,
    entityId: row.entity_id ?? null,
    read: Boolean(row.read),
    createdAt: row.created_at,
  };
}

function mapRecommendation(row: Row): Recommendation {
  return {
    id: row.id,
    authorId: row.author_id,
    targetId: row.target_id,
    content: row.content ?? "",
    status: row.status ?? "pending",
    createdAt: row.created_at,
  };
}

function mapCollaboration(row: Row): Collaboration {
  const participants: Row[] = row.collaboration_participants ?? [];
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    participantIds: participants.map((participant) => participant.user_id),
    confirmedIds: participants
      .filter((participant) => participant.confirmed)
      .map((participant) => participant.user_id),
    year: row.year ?? "",
  };
}

function mapReport(row: Row): Report {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type as ReportTarget,
    targetId: row.target_id,
    category: row.category ?? "",
    description: row.description ?? "",
    status: row.status ?? "open",
    createdAt: row.created_at,
  };
}

function mapBlock(row: Row): Block {
  return {
    id: row.id,
    blockerId: row.blocker_id,
    blockedId: row.blocked_id,
    createdAt: row.created_at,
  };
}

function mapSubscription(row: Row | null): Subscription {
  if (!row) return { tier: "free", status: "active" };
  return {
    tier: row.tier === "premium" ? "premium" : "free",
    status: row.status ?? "active",
    startedAt: row.started_at ?? undefined,
    renewsAt: row.renews_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
  };
}

function mapPromotion(row: Row): Promotion {
  return {
    id: row.id,
    ownerId: row.owner_id,
    targetType: row.target_type,
    targetId: row.target_id,
    budget: Number(row.budget),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    views: Number(row.views ?? 0),
    interactions: Number(row.interactions ?? 0),
  };
}

function mapSavedSearch(row: Row): SavedSearch {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    skills: strings<SkillId>(row.skills),
    goals: strings<GoalId>(row.goals),
    experience: row.experience ?? "any",
    createdAt: row.created_at,
  };
}

function mapSettings(row: Row): UserSettings {
  return {
    language: (row.language ?? "pt-BR") as Language,
    profileVisibility: row.profile_visibility === "public" ? "public" : "members",
    showGoals: Boolean(row.show_goals),
    allowMessagesFrom: row.allow_messages_from === "everyone" ? "everyone" : "connections",
    emailNotifications: Boolean(row.email_notifications),
  };
}

function mapTerms(row: Row): TermsAcceptance {
  return {
    userId: row.user_id,
    document: row.document,
    version: row.version,
    acceptedAt: row.accepted_at,
  };
}

function mapDeletion(row: Row): DeletionRequest {
  return {
    id: row.id,
    userId: row.user_id,
    requestedAt: row.requested_at,
    status: row.status ?? "pending",
  };
}

function mapOfficialAnnouncement(row: Row): OfficialAnnouncement {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? "",
    createdAt: row.created_at,
  };
}

function isNetworkFailure(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("load failed") ||
    lower.includes("connection refused") ||
    lower.includes("enotfound") ||
    lower.includes("err_name_not_resolved") ||
    lower.includes("timed out")
  );
}

function mapPostgrestError(
  error: { code?: string; message?: string; details?: string } | null,
): never {
  const message = error?.message ?? "";
  const code = error?.code ?? "";
  const lower = message.toLowerCase();

  if (isNetworkFailure(message)) throw new RepositoryError("NETWORK", message);

  if (code === "23505" && (lower.includes("username") || lower.includes("profiles_username"))) {
    throw new RepositoryError("INVALID", "username_taken");
  }
  if (code === "23505") throw new RepositoryError("INVALID", "duplicate");
  if (code === "23514") throw new RepositoryError("INVALID", "constraint");
  if (lower.includes("last_admin")) {
    throw new RepositoryError("FORBIDDEN", "admin_cannot_leave");
  }
  if (lower.includes("daily_limit")) throw new RepositoryError("DAILY_LIMIT");
  if (lower.includes("blocked")) throw new RepositoryError("BLOCKED");
  if (lower.includes("not_connected")) throw new RepositoryError("FORBIDDEN", "not_connected");
  if (lower.includes("not_found")) throw new RepositoryError("INVALID", "not_found");
  if (lower.includes("self")) throw new RepositoryError("INVALID", "self");
  if (
    code === "42501" ||
    lower.includes("row-level security") ||
    lower.includes("permission denied")
  ) {
    throw new RepositoryError("FORBIDDEN");
  }
  if (code === "PGRST116") throw new RepositoryError("INVALID", "not_found");
  throw new RepositoryError("INVALID", message || "request_failed");
}

function mapAuthError(error: {
  message: string;
  status?: number | undefined;
  name?: string | undefined;
}): never {
  const message = error.message.toLowerCase();
  // Status 0 / AuthRetryableFetchError acontece quando o host do Supabase está
  // inacessível (projeto pausado, DNS, offline). Não é credencial inválida.
  if (error.status === 0 || error.name === "AuthRetryableFetchError" || isNetworkFailure(message)) {
    throw new RepositoryError("NETWORK", error.message);
  }
  if (message.includes("invalid login credentials")) {
    throw new RepositoryError("INVALID_CREDENTIALS");
  }
  if (message.includes("email not confirmed")) {
    throw new RepositoryError("EMAIL_NOT_CONFIRMED");
  }
  if (message.includes("already registered") || message.includes("already been registered")) {
    throw new RepositoryError("EMAIL_TAKEN");
  }
  if (message.includes("password") && (message.includes("least") || message.includes("weak"))) {
    throw new RepositoryError("WEAK_PASSWORD");
  }
  if (message.includes("rate limit")) {
    throw new RepositoryError("INVALID", "rate_limit");
  }
  throw new RepositoryError("INVALID", error.message);
}

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 30);
}

function startOfDayIso(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export class SupabaseRepository implements NetclubRepository {
  readonly source = "supabase" as const;
  readonly isDemo = false;

  private get client() {
    return getSupabaseClient();
  }

  private async userId(): Promise<string> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw new RepositoryError("NETWORK", error.message);
    const id = data.session?.user.id;
    if (!id) throw new RepositoryError("NOT_AUTHENTICATED");
    return id;
  }

  // ---------------------------------------------------------------- sessão

  async getSession(): Promise<string | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) return null;
    return data.session?.user.id ?? null;
  }

  async signIn(email: string, password: string): Promise<string> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) mapAuthError(error);
    if (!data.user) throw new RepositoryError("INVALID_CREDENTIALS");
    return data.user.id;
  }

  async signUp(input: SignUpInput): Promise<SignUpResult> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: { full_name: input.fullName.trim() },
      },
    });
    if (error) mapAuthError(error);
    return {
      userId: data.user?.id ?? null,
      needsConfirmation: !data.session,
    };
  }

  async resetPassword(email: string): Promise<void> {
    const { error } =
      typeof window === "undefined"
        ? await this.client.auth.resetPasswordForEmail(email.trim())
        : await this.client.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/reset-password`,
          });
    if (error) mapAuthError(error);
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) mapAuthError(error);
  }

  async signInDemo(): Promise<string> {
    throw new RepositoryError("BACKEND_REQUIRED", "demo_mode");
  }

  async signUpDemo(_fullName: string): Promise<string> {
    throw new RepositoryError("BACKEND_REQUIRED", "demo_mode");
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  // ---------------------------------------------------------------- perfil

  private async blockedIds(userId: string): Promise<Set<string>> {
    const { data, error } = await this.client
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId);
    if (error) mapPostgrestError(error);
    return new Set((data ?? []).map((row: Row) => row.blocked_id as string));
  }

  async getProfile(id: string): Promise<Profile | null> {
    const me = await this.getSession();
    if (me) {
      const blocked = await this.blockedIds(me);
      if (blocked.has(id)) return null;
    }
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) mapPostgrestError(error);
    return data ? mapProfile(data) : null;
  }

  async listProfiles(): Promise<Profile[]> {
    const me = await this.userId();
    const blocked = await this.blockedIds(me);
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("onboarded", true)
      .neq("id", me)
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).filter((row: Row) => !blocked.has(row.id)).map(mapProfile);
  }

  async listDirectory(): Promise<Profile[]> {
    const me = await this.userId();
    const blocked = await this.blockedIds(me);
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).filter((row: Row) => !blocked.has(row.id)).map(mapProfile);
  }

  async getCurrentProfile(): Promise<Profile | null> {
    const me = await this.getSession();
    if (!me) return null;
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", me)
      .maybeSingle();
    if (error) mapPostgrestError(error);
    return data ? mapProfile(data) : null;
  }

  async completeOnboarding(input: OnboardingInput): Promise<void> {
    const me = await this.userId();
    const { error } = await this.client
      .from("profiles")
      .update({
        username: normalizeUsername(input.username),
        full_name: input.fullName.trim(),
        headline: input.headline.trim(),
        area: input.area.trim(),
        bio: input.bio.trim(),
        avatar_url: input.avatarUrl ?? null,
        location: input.location.trim(),
        experience: input.experience,
        skills: input.skills,
        interests: input.interests,
        goals: input.goals,
        looking_for: input.lookingFor.trim(),
        offering: input.offering.trim(),
        onboarded: true,
      })
      .eq("id", me);
    if (error) mapPostgrestError(error);
  }

  async updateProfile(input: ProfileUpdateInput): Promise<void> {
    const me = await this.userId();
    const patch: Row = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName.trim();
    if (input.username !== undefined) patch.username = normalizeUsername(input.username);
    if (input.headline !== undefined) patch.headline = input.headline.trim();
    if (input.area !== undefined) patch.area = input.area.trim();
    if (input.bio !== undefined) patch.bio = input.bio.trim();
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    if (input.location !== undefined) patch.location = input.location.trim();
    if (input.experience !== undefined) patch.experience = input.experience;
    if (input.skills !== undefined) patch.skills = input.skills;
    if (input.interests !== undefined) patch.interests = input.interests;
    if (input.goals !== undefined) patch.goals = input.goals;
    if (input.lookingFor !== undefined) patch.looking_for = input.lookingFor.trim();
    if (input.offering !== undefined) patch.offering = input.offering.trim();
    if (input.portfolio !== undefined) patch.portfolio = input.portfolio;
    if (input.links !== undefined) patch.links = input.links;

    if (Object.keys(patch).length === 0) return;

    const { error } = await this.client.from("profiles").update(patch).eq("id", me);
    if (error) mapPostgrestError(error);
  }

  async uploadImage(file: File, kind: UploadKind): Promise<string> {
    if (!file.type.startsWith("image/")) {
      throw new RepositoryError("INVALID", "invalid_file_type");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new RepositoryError("INVALID", "file_too_large");
    }

    const me = await this.userId();
    const bucket = BUCKETS[kind];
    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${me}/${crypto.randomUUID()}.${extension}`;

    const { error } = await this.client.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new RepositoryError("INVALID", error.message);

    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // ---------------------------------------------------------------- feed

  async getFeed(): Promise<Post[]> {
    const me = await this.userId();
    const blocked = await this.blockedIds(me);
    const { data, error } = await this.client
      .from("posts")
      .select(
        "id, author_id, content, created_at, club_id, sponsored, hidden, post_likes(user_id), post_saves(user_id)",
      )
      .eq("hidden", false)
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).filter((row: Row) => !blocked.has(row.author_id)).map(mapPost);
  }

  async createPost(content: string, clubId?: string | null): Promise<void> {
    const me = await this.userId();
    const clean = content.trim();
    if (!clean) throw new RepositoryError("INVALID", "empty");
    const { error } = await this.client.from("posts").insert({
      author_id: me,
      content: clean,
      club_id: clubId ?? null,
    });
    if (error) mapPostgrestError(error);
  }

  async updatePost(id: string, content: string): Promise<void> {
    const me = await this.userId();
    const clean = content.trim();
    if (!clean) throw new RepositoryError("INVALID", "empty");
    const { data, error } = await this.client
      .from("posts")
      .update({ content: clean })
      .eq("id", id)
      .eq("author_id", me)
      .select("id");
    if (error) mapPostgrestError(error);
    if (!data || data.length === 0) throw new RepositoryError("FORBIDDEN");
  }

  async deletePost(id: string): Promise<void> {
    const me = await this.userId();
    const { data: post, error: readError } = await this.client
      .from("posts")
      .select("author_id")
      .eq("id", id)
      .maybeSingle();
    if (readError) mapPostgrestError(readError);
    if (!post) return;
    if (post.author_id !== me) throw new RepositoryError("FORBIDDEN");
    const { error } = await this.client.from("posts").delete().eq("id", id).eq("author_id", me);
    if (error) mapPostgrestError(error);
  }

  async toggleLike(postId: string): Promise<void> {
    const me = await this.userId();
    const { data: existing, error: readError } = await this.client
      .from("post_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", me)
      .maybeSingle();
    if (readError) mapPostgrestError(readError);

    if (existing) {
      const { error } = await this.client
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", me);
      if (error) mapPostgrestError(error);
      return;
    }

    const { error } = await this.client.from("post_likes").insert({ post_id: postId, user_id: me });
    if (error) mapPostgrestError(error);
  }

  async toggleSave(postId: string): Promise<void> {
    const me = await this.userId();
    const { data: existing, error: readError } = await this.client
      .from("post_saves")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", me)
      .maybeSingle();
    if (readError) mapPostgrestError(readError);

    if (existing) {
      const { error } = await this.client
        .from("post_saves")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", me);
      if (error) mapPostgrestError(error);
      return;
    }

    const { error } = await this.client.from("post_saves").insert({ post_id: postId, user_id: me });
    if (error) mapPostgrestError(error);
  }

  async listComments(postId: string): Promise<Comment[]> {
    const { data, error } = await this.client
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapComment);
  }

  async addComment(postId: string, content: string, parentId?: string | null): Promise<void> {
    const me = await this.userId();
    const clean = content.trim();
    if (!clean) throw new RepositoryError("INVALID", "empty");
    const { error } = await this.client.from("comments").insert({
      post_id: postId,
      author_id: me,
      content: clean,
      parent_id: parentId ?? null,
    });
    if (error) mapPostgrestError(error);
  }

  async deleteComment(id: string): Promise<void> {
    const me = await this.userId();
    const { data: comment, error: readError } = await this.client
      .from("comments")
      .select("author_id")
      .eq("id", id)
      .maybeSingle();
    if (readError) mapPostgrestError(readError);
    if (!comment) return;
    if (comment.author_id !== me) throw new RepositoryError("FORBIDDEN");
    const { error } = await this.client.from("comments").delete().eq("id", id);
    if (error) mapPostgrestError(error);
  }

  // ---------------------------------------------------------------- stories

  async listStories(): Promise<Story[]> {
    const { data, error } = await this.client
      .from("stories")
      .select("*, story_views(user_id)")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapStory);
  }

  async createStory(input: {
    text: string;
    background: string;
    imageUrl?: string | null;
  }): Promise<void> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("stories")
      .insert({
        author_id: me,
        text: input.text.trim(),
        background: input.background,
        image_url: input.imageUrl ?? null,
      })
      .select("id")
      .single();
    if (error) mapPostgrestError(error);
    if (data?.id) {
      await this.client
        .from("story_views")
        .upsert(
          { story_id: data.id, user_id: me },
          { onConflict: "story_id,user_id", ignoreDuplicates: true },
        );
    }
  }

  async deleteStory(id: string): Promise<void> {
    const me = await this.userId();
    const { data: story, error: readError } = await this.client
      .from("stories")
      .select("author_id")
      .eq("id", id)
      .maybeSingle();
    if (readError) mapPostgrestError(readError);
    if (!story) return;
    if (story.author_id !== me) throw new RepositoryError("FORBIDDEN");
    const { error } = await this.client.from("stories").delete().eq("id", id);
    if (error) mapPostgrestError(error);
  }

  async markStoryViewed(id: string): Promise<void> {
    const me = await this.getSession();
    if (!me) return;
    const { error } = await this.client
      .from("story_views")
      .upsert(
        { story_id: id, user_id: me },
        { onConflict: "story_id,user_id", ignoreDuplicates: true },
      );
    if (error) mapPostgrestError(error);
  }

  // ---------------------------------------------------------------- netmach

  async getMatchInterests(): Promise<MatchInterest[]> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("match_interests")
      .select("*")
      .or(`from_id.eq.${me},to_id.eq.${me}`);
    if (error) mapPostgrestError(error);
    return (data ?? []).map((row: Row) => ({
      fromId: row.from_id,
      toId: row.to_id,
      createdAt: row.created_at,
    }));
  }

  async getMatchState(): Promise<MatchState> {
    const me = await this.userId();
    const [interests, passes, connections, profiles, blocked] = await Promise.all([
      this.getMatchInterests(),
      this.client
        .from("match_passes")
        .select("*")
        .eq("from_id", me)
        .then(({ data, error }) => {
          if (error) mapPostgrestError(error);
          return (data ?? []) as Row[];
        }),
      this.listConnections(),
      this.listProfiles(),
      this.blockedIds(me),
    ]);

    const likes = interests.filter((item) => item.fromId === me).map((item) => item.toId);
    const likesOfMe = interests.filter((item) => item.toId === me).map((item) => item.fromId);
    const passIds = passes.map((row) => row.to_id as string);
    const connected = new Set(
      connections
        .filter((connection) => connection.status === "accepted")
        .map((connection) =>
          connection.requesterId === me ? connection.addresseeId : connection.requesterId,
        ),
    );
    const mutual = likes.filter((id) => likesOfMe.includes(id));
    const byId = new Map(profiles.map((profile) => [profile.id, profile]));

    const usedToday = interests.filter(
      (item) => item.fromId === me && Date.parse(item.createdAt) >= Date.parse(startOfDayIso()),
    ).length;

    return {
      candidates: profiles.filter(
        (profile) =>
          profile.onboarded &&
          !blocked.has(profile.id) &&
          !likes.includes(profile.id) &&
          !passIds.includes(profile.id) &&
          !connected.has(profile.id),
      ),
      matches: mutual
        .map((id) => byId.get(id))
        .filter((profile): profile is Profile => Boolean(profile)),
      likesSent: likes,
      passes: passIds,
      usedToday,
      dailyLimit: FREE_NETMACH_DAILY_LIMIT,
    };
  }

  async likeProfile(targetId: string): Promise<{ matched: boolean }> {
    const me = await this.userId();

    const { count, error: countError } = await this.client
      .from("match_interests")
      .select("*", { count: "exact", head: true })
      .eq("from_id", me)
      .gte("created_at", startOfDayIso());
    if (countError) mapPostgrestError(countError);
    if ((count ?? 0) >= FREE_NETMACH_DAILY_LIMIT) {
      throw new RepositoryError("DAILY_LIMIT");
    }

    const { error } = await this.client
      .from("match_interests")
      .upsert(
        { from_id: me, to_id: targetId },
        { onConflict: "from_id,to_id", ignoreDuplicates: true },
      );
    if (error) mapPostgrestError(error);

    const { data: reverse, error: reverseError } = await this.client
      .from("match_interests")
      .select("from_id")
      .eq("from_id", targetId)
      .eq("to_id", me)
      .maybeSingle();
    if (reverseError) mapPostgrestError(reverseError);

    return { matched: Boolean(reverse) };
  }

  async passProfile(targetId: string): Promise<void> {
    const me = await this.userId();
    const { error } = await this.client
      .from("match_passes")
      .upsert(
        { from_id: me, to_id: targetId },
        { onConflict: "from_id,to_id", ignoreDuplicates: true },
      );
    if (error) mapPostgrestError(error);
  }

  // ---------------------------------------------------------------- conexões

  async listConnections(): Promise<Connection[]> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("connections")
      .select("*")
      .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapConnection);
  }

  async sendConnectionRequest(targetId: string): Promise<void> {
    const me = await this.userId();
    if (me === targetId) throw new RepositoryError("INVALID", "self");

    const connections = await this.listConnections();
    const existing = connections.find(
      (connection) =>
        (connection.requesterId === me && connection.addresseeId === targetId) ||
        (connection.requesterId === targetId && connection.addresseeId === me),
    );

    if (existing) {
      if (existing.status === "pending" && existing.addresseeId === me) {
        await this.respondConnection(existing.id, true);
      }
      return;
    }

    const { error } = await this.client.from("connections").insert({
      requester_id: me,
      addressee_id: targetId,
      status: "pending",
    });
    if (error) mapPostgrestError(error);
  }

  async respondConnection(id: string, accept: boolean): Promise<void> {
    const me = await this.userId();
    if (accept) {
      const { data, error } = await this.client
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", id)
        .eq("addressee_id", me)
        .select("id");
      if (error) mapPostgrestError(error);
      if (!data || data.length === 0) throw new RepositoryError("FORBIDDEN");
      return;
    }

    const { data, error } = await this.client
      .from("connections")
      .delete()
      .eq("id", id)
      .eq("addressee_id", me)
      .select("id");
    if (error) mapPostgrestError(error);
    if (!data || data.length === 0) throw new RepositoryError("FORBIDDEN");
  }

  async removeConnection(id: string): Promise<void> {
    const { error } = await this.client.from("connections").delete().eq("id", id);
    if (error) mapPostgrestError(error);
  }

  // ---------------------------------------------------------------- grupos

  async listClubs(): Promise<Club[]> {
    const { data, error } = await this.client
      .from("clubs")
      .select("*, club_members(user_id, role)")
      .order("created_at", { ascending: true });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapClub);
  }

  async getClub(slug: string): Promise<Club | null> {
    const { data, error } = await this.client
      .from("clubs")
      .select("*, club_members(user_id, role)")
      .eq("slug", slug)
      .maybeSingle();
    if (error) mapPostgrestError(error);
    return data ? mapClub(data) : null;
  }

  async joinClub(clubId: string): Promise<void> {
    const me = await this.userId();
    const { error } = await this.client
      .from("club_members")
      .upsert(
        { club_id: clubId, user_id: me, role: "member" },
        { onConflict: "club_id,user_id", ignoreDuplicates: true },
      );
    if (error) mapPostgrestError(error);
  }

  async leaveClub(clubId: string): Promise<void> {
    const me = await this.userId();
    const { data: membership, error: readError } = await this.client
      .from("club_members")
      .select("role")
      .eq("club_id", clubId)
      .eq("user_id", me)
      .maybeSingle();
    if (readError) mapPostgrestError(readError);
    if (!membership) return;
    if (membership.role === "admin") {
      throw new RepositoryError("FORBIDDEN", "admin_cannot_leave");
    }
    const { error } = await this.client
      .from("club_members")
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", me);
    if (error) mapPostgrestError(error);
  }

  // ---------------------------------------------------------------- chat

  async listConversations(): Promise<Conversation[]> {
    const { data, error } = await this.client
      .from("conversations")
      .select("*, conversation_members(user_id)")
      .order("updated_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapConversation);
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.client
      .from("messages")
      .select("*, message_reads(user_id)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapMessage);
  }

  async sendMessage(conversationId: string, content: string): Promise<void> {
    const me = await this.userId();
    const clean = content.trim();
    if (!clean) throw new RepositoryError("INVALID", "empty");
    const { error } = await this.client.from("messages").insert({
      conversation_id: conversationId,
      sender_id: me,
      content: clean,
    });
    if (error) mapPostgrestError(error);
  }

  async startConversation(profileId: string): Promise<string> {
    const { data, error } = await this.client.rpc("start_conversation", { target: profileId });
    if (error) mapPostgrestError(error);
    if (!data) throw new RepositoryError("INVALID", "not_found");
    return data as string;
  }

  // ---------------------------------------------------------------- notificações

  async listNotifications(): Promise<Notification[]> {
    const { data, error } = await this.client
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapNotification);
  }

  async markNotificationsRead(): Promise<void> {
    const me = await this.userId();
    const { error } = await this.client
      .from("notifications")
      .update({ read: true })
      .eq("user_id", me)
      .eq("read", false);
    if (error) mapPostgrestError(error);
  }

  // ---------------------------------------------------------------- perfil profissional

  async listRecommendations(profileId: string): Promise<Recommendation[]> {
    const me = await this.getSession();
    const { data, error } = await this.client
      .from("recommendations")
      .select("*")
      .eq("target_id", profileId)
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? [])
      .map(mapRecommendation)
      .filter(
        (recommendation) =>
          recommendation.status === "accepted" ||
          recommendation.authorId === me ||
          recommendation.targetId === me,
      );
  }

  async requestRecommendation(targetId: string, content: string): Promise<void> {
    const me = await this.userId();
    if (me === targetId) throw new RepositoryError("INVALID", "self");

    const connections = await this.listConnections();
    const connected = connections.some(
      (connection) =>
        connection.status === "accepted" &&
        ((connection.requesterId === me && connection.addresseeId === targetId) ||
          (connection.requesterId === targetId && connection.addresseeId === me)),
    );
    if (!connected) throw new RepositoryError("FORBIDDEN", "not_connected");

    const clean = content.trim();
    if (!clean) throw new RepositoryError("INVALID", "empty");

    const { error } = await this.client.from("recommendations").insert({
      author_id: me,
      target_id: targetId,
      content: clean,
      status: "pending",
    });
    if (error) mapPostgrestError(error);
  }

  async respondRecommendation(id: string, accept: boolean): Promise<void> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("recommendations")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", id)
      .eq("target_id", me)
      .select("id");
    if (error) mapPostgrestError(error);
    if (!data || data.length === 0) throw new RepositoryError("FORBIDDEN");
  }

  async listCollaborations(profileId: string): Promise<Collaboration[]> {
    const { data, error } = await this.client
      .from("collaborations")
      .select("*, collaboration_participants(user_id, confirmed)")
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? [])
      .map(mapCollaboration)
      .filter((collaboration) => collaboration.participantIds.includes(profileId));
  }

  async addCollaboration(input: {
    title: string;
    description: string;
    participantIds: string[];
    year: string;
  }): Promise<void> {
    const { error } = await this.client.rpc("create_collaboration", {
      title: input.title.trim(),
      description: input.description.trim(),
      year: input.year,
      participant_ids: input.participantIds,
    });
    if (error) mapPostgrestError(error);
  }

  async confirmCollaboration(id: string): Promise<void> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("collaboration_participants")
      .update({ confirmed: true })
      .eq("collaboration_id", id)
      .eq("user_id", me)
      .select("user_id");
    if (error) mapPostgrestError(error);
    if (!data || data.length === 0) throw new RepositoryError("FORBIDDEN");
  }

  // ---------------------------------------------------------------- moderação

  async report(input: ReportInput): Promise<void> {
    const me = await this.userId();
    const { error } = await this.client.from("reports").insert({
      reporter_id: me,
      target_type: input.targetType,
      target_id: input.targetId,
      category: input.category,
      description: input.description.trim(),
    });
    if (error) mapPostgrestError(error);
  }

  async listReports(): Promise<Report[]> {
    const me = await this.getCurrentProfile();
    if (me?.role !== "admin") throw new RepositoryError("FORBIDDEN");
    const { data, error } = await this.client
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapReport);
  }

  async blockUser(targetId: string): Promise<void> {
    const { error } = await this.client.rpc("block_user", { target: targetId });
    if (error) mapPostgrestError(error);
  }

  async unblockUser(targetId: string): Promise<void> {
    const me = await this.userId();
    const { error } = await this.client
      .from("blocks")
      .delete()
      .eq("blocker_id", me)
      .eq("blocked_id", targetId);
    if (error) mapPostgrestError(error);
  }

  async listBlocked(): Promise<Block[]> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("blocks")
      .select("*")
      .eq("blocker_id", me)
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapBlock);
  }

  async listBlockedProfiles(): Promise<Profile[]> {
    const blocks = await this.listBlocked();
    if (blocks.length === 0) return [];
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .in(
        "id",
        blocks.map((block) => block.blockedId),
      );
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapProfile);
  }

  // ---------------------------------------------------------------- canal oficial

  async getQuotes(): Promise<MarketQuote[]> {
    // Nenhum provedor de cotações contratado: a resposta correta é "indisponível".
    return [];
  }

  async getNews(): Promise<NewsItem[]> {
    // Nenhum provedor de notícias contratado.
    return [];
  }

  async getOfficialAnnouncements(): Promise<OfficialAnnouncement[]> {
    const { data, error } = await this.client
      .from("official_announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapOfficialAnnouncement);
  }

  // ---------------------------------------------------------------- monetização

  async getSubscription(): Promise<Subscription> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("subscriptions")
      .select("*")
      .eq("user_id", me)
      .maybeSingle();
    if (error) mapPostgrestError(error);
    return mapSubscription(data);
  }

  async listPromotions(): Promise<Promotion[]> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("promotions")
      .select("*")
      .eq("owner_id", me)
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapPromotion);
  }

  async createPromotion(_input: PromotionInput): Promise<void> {
    // Não existe gateway de pagamento: nenhuma campanha é simulada.
    throw new RepositoryError("PAYMENTS_UNAVAILABLE");
  }

  async listSavedSearches(): Promise<SavedSearch[]> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("saved_searches")
      .select("*")
      .eq("user_id", me)
      .order("created_at", { ascending: false });
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapSavedSearch);
  }

  async saveSearch(input: SavedSearchInput): Promise<void> {
    const me = await this.userId();
    const subscription = await this.getSubscription();
    if (subscription.tier !== "premium") throw new RepositoryError("PREMIUM_REQUIRED");

    const { error } = await this.client.from("saved_searches").insert({
      user_id: me,
      name: input.name.trim(),
      skills: input.skills,
      goals: input.goals,
      experience: input.experience,
    });
    if (error) mapPostgrestError(error);
  }

  async deleteSavedSearch(id: string): Promise<void> {
    const me = await this.userId();
    const { error } = await this.client
      .from("saved_searches")
      .delete()
      .eq("id", id)
      .eq("user_id", me);
    if (error) mapPostgrestError(error);
  }

  // ---------------------------------------------------------------- configurações / LGPD

  async getSettings(): Promise<UserSettings> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("user_settings")
      .select("*")
      .eq("user_id", me)
      .maybeSingle();
    if (error) mapPostgrestError(error);
    if (data) return mapSettings(data);

    const { error: insertError } = await this.client
      .from("user_settings")
      .insert({ user_id: me })
      .select("user_id");
    if (insertError && insertError.code !== "23505") mapPostgrestError(insertError);
    return DEFAULT_SETTINGS;
  }

  async updateSettings(patch: Partial<UserSettings>): Promise<void> {
    const me = await this.userId();
    const row: Row = {};
    if (patch.language !== undefined) row.language = patch.language;
    if (patch.profileVisibility !== undefined) row.profile_visibility = patch.profileVisibility;
    if (patch.showGoals !== undefined) row.show_goals = patch.showGoals;
    if (patch.allowMessagesFrom !== undefined) row.allow_messages_from = patch.allowMessagesFrom;
    if (patch.emailNotifications !== undefined) row.email_notifications = patch.emailNotifications;
    if (Object.keys(row).length === 0) return;

    const { error } = await this.client.from("user_settings").update(row).eq("user_id", me);
    if (error) mapPostgrestError(error);
  }

  async setLanguage(language: Language): Promise<void> {
    await this.updateSettings({ language });
  }

  async getTermsAcceptances(): Promise<TermsAcceptance[]> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("terms_acceptances")
      .select("*")
      .eq("user_id", me);
    if (error) mapPostgrestError(error);
    return (data ?? []).map(mapTerms);
  }

  async acceptTerms(documents: TermsAcceptance["document"][]): Promise<void> {
    const me = await this.userId();
    if (documents.length === 0) return;
    const { error } = await this.client.from("terms_acceptances").upsert(
      documents.map((document) => ({
        user_id: me,
        document,
        version: "2026-01",
        accepted_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,document", ignoreDuplicates: true },
    );
    if (error) mapPostgrestError(error);
  }

  async getDeletionRequest(): Promise<DeletionRequest | null> {
    const me = await this.userId();
    const { data, error } = await this.client
      .from("deletion_requests")
      .select("*")
      .eq("user_id", me)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) mapPostgrestError(error);
    return data ? mapDeletion(data) : null;
  }

  async requestAccountDeletion(): Promise<void> {
    const me = await this.userId();
    const existing = await this.getDeletionRequest();
    if (existing) return;
    const { error } = await this.client
      .from("deletion_requests")
      .insert({ user_id: me, status: "pending" });
    if (error) mapPostgrestError(error);
  }

  // ---------------------------------------------------------------- testes / admin

  async getSnapshot(): Promise<NetclubDb> {
    const me = await this.getSession();
    const [profiles, posts, comments, stories, connections, conversations, clubs, notifications] =
      await Promise.all([
        this.listDirectory(),
        this.getFeed(),
        this.client
          .from("comments")
          .select("*")
          .then(({ data, error }) => {
            if (error) mapPostgrestError(error);
            return (data ?? []).map(mapComment);
          }),
        this.listStories(),
        this.listConnections(),
        this.listConversations(),
        this.listClubs(),
        this.listNotifications(),
      ]);

    const messages = (
      await Promise.all(conversations.map((conversation) => this.listMessages(conversation.id)))
    ).flat();

    return {
      currentUserId: me,
      profiles,
      posts,
      comments,
      stories,
      connections,
      conversations,
      messages,
      clubs,
      notifications,
      recommendations: [],
      collaborations: [],
      reports: [],
      blocks: await this.listBlocked(),
      matchInterests: await this.getMatchInterests(),
      matchPasses: [],
      promotions: await this.listPromotions(),
      subscriptions: {},
      savedSearches: await this.listSavedSearches(),
      settings: {},
      termsAcceptances: await this.getTermsAcceptances(),
      deletionRequests: [],
      quotes: [],
      news: [],
      officialAnnouncements: await this.getOfficialAnnouncements(),
    };
  }
}

export function createSupabaseRepository(): NetclubRepository {
  return new SupabaseRepository();
}
