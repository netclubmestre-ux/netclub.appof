/**
 * Repositório de DEMONSTRAÇÃO.
 *
 * Mantém o estado em memória (reinicia ao recarregar a página) e nunca faz
 * requisições de rede. Serve para validar todas as telas antes da integração.
 * A UI é avisada por `isDemo` e exibe o selo "Modo demonstração".
 */
import { createDemoDb } from "./dev-data";
import {
  RepositoryError,
  type MatchState,
  type NetclubRepository,
  type OnboardingInput,
  type PostMediaInput,
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
  type Collaboration,
  type Comment,
  type Connection,
  type Conversation,
  type DeletionRequest,
  type Language,
  type MarketQuote,
  type MatchInterest,
  type Message,
  type NetclubDb,
  type NewsItem,
  type Notification,
  type OfficialAnnouncement,
  type Post,
  type PostCategory,
  type Profile,
  type Promotion,
  type Recommendation,
  type Report,
  type SavedSearch,
  type Story,
  type Subscription,
  type TermsAcceptance,
  type UserSettings,
} from "./types";

export { RepositoryError } from "./repository";
export type { RepositoryErrorCode } from "./repository";

const newId = () => crypto.randomUUID();
const iso = () => new Date().toISOString();
const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export class DevRepository implements NetclubRepository {
  readonly source = "demo" as const;
  readonly isDemo = true;

  private db: NetclubDb;

  constructor(db: NetclubDb = createDemoDb()) {
    this.db = db;
    this.pruneExpiredStories();
  }

  private pruneExpiredStories() {
    const now = Date.now();
    this.db.stories = this.db.stories.filter((s) => Date.parse(s.expiresAt) > now);
  }

  private requireUser(): string {
    if (!this.db.currentUserId) throw new RepositoryError("NOT_AUTHENTICATED");
    return this.db.currentUserId;
  }

  private profile(id: string): Profile | undefined {
    return this.db.profiles.find((p) => p.id === id);
  }

  private isBlocked(a: string, b: string) {
    return this.db.blocks.some(
      (x) => (x.blockerId === a && x.blockedId === b) || (x.blockerId === b && x.blockedId === a),
    );
  }

  private settingsOf(userId: string): UserSettings {
    const existing = this.db.settings[userId];
    if (existing) return existing;
    const fallback: UserSettings = {
      language: "pt-BR",
      profileVisibility: "members",
      showGoals: true,
      allowMessagesFrom: "connections",
      emailNotifications: true,
    };
    this.db.settings[userId] = fallback;
    return fallback;
  }

  private notify(input: Omit<Notification, "id" | "read" | "createdAt">) {
    this.db.notifications.unshift({
      ...input,
      id: newId(),
      read: false,
      createdAt: iso(),
    });
  }

  private isConnected(a: string, b: string) {
    return this.db.connections.some(
      (c) =>
        c.status === "accepted" &&
        ((c.requesterId === a && c.addresseeId === b) ||
          (c.requesterId === b && c.addresseeId === a)),
    );
  }

  // ---------------------------------------------------------------- sessão

  async getSession() {
    return this.db.currentUserId;
  }

  async signIn(_email: string, _password: string): Promise<string> {
    throw new RepositoryError("BACKEND_REQUIRED", "demo_mode");
  }

  async signUp(_input: SignUpInput): Promise<SignUpResult> {
    throw new RepositoryError("BACKEND_REQUIRED", "demo_mode");
  }

  async resetPassword(_email: string): Promise<void> {
    throw new RepositoryError("BACKEND_REQUIRED", "demo_mode");
  }

  async updatePassword(_password: string): Promise<void> {
    throw new RepositoryError("BACKEND_REQUIRED", "demo_mode");
  }

  async signInDemo() {
    this.db.currentUserId = "u-ana";
    this.settingsOf("u-ana");
    return "u-ana";
  }

  async signUpDemo(fullName: string) {
    const base = this.profile("u-ana")!;
    const id = newId();
    const suffix = Math.random().toString(36).slice(2, 6);
    const created: Profile = {
      ...base,
      id,
      fullName: fullName.trim() || "Novo membro",
      username: `membro${suffix}`,
      headline: "",
      area: "",
      bio: "",
      avatarUrl: null,
      location: "",
      experience: "beginner",
      skills: [],
      interests: [],
      goals: [],
      lookingFor: "",
      offering: "",
      portfolio: [],
      links: [],
      onboarded: false,
      role: "member",
      createdAt: iso(),
    };
    this.db.profiles.push(created);
    this.db.currentUserId = id;
    this.settingsOf(id);
    return id;
  }

  async signOut() {
    this.db.currentUserId = null;
  }

  // ---------------------------------------------------------------- perfil

  async getProfile(id: string) {
    const me = this.db.currentUserId;
    if (me && this.isBlocked(me, id)) return null;
    return this.profile(id) ?? null;
  }

  async listProfiles() {
    const me = this.requireUser();
    return this.db.profiles.filter((p) => p.id !== me && !this.isBlocked(me, p.id));
  }

  async listDirectory() {
    const me = this.db.currentUserId;
    return this.db.profiles.filter((p) => !me || !this.isBlocked(me, p.id));
  }

  async getCurrentProfile() {
    const me = this.db.currentUserId;
    return me ? (this.profile(me) ?? null) : null;
  }

  async completeOnboarding(input: OnboardingInput) {
    const me = this.requireUser();
    const target = this.profile(me);
    if (!target) throw new RepositoryError("NOT_AUTHENTICATED");
    const usernameTaken = this.db.profiles.some(
      (p) => p.id !== me && p.username.toLowerCase() === input.username.trim().toLowerCase(),
    );
    if (usernameTaken) throw new RepositoryError("INVALID", "username_taken");
    Object.assign(target, { ...input, onboarded: true });
  }

  async updateProfile(input: ProfileUpdateInput) {
    const me = this.requireUser();
    const target = this.profile(me);
    if (!target) throw new RepositoryError("NOT_AUTHENTICATED");
    if (input.username) {
      const usernameTaken = this.db.profiles.some(
        (p) => p.id !== me && p.username.toLowerCase() === input.username!.trim().toLowerCase(),
      );
      if (usernameTaken) throw new RepositoryError("INVALID", "username_taken");
    }
    Object.assign(target, input);
  }

  async uploadImage(file: File, _kind: UploadKind): Promise<string> {
    return URL.createObjectURL(file);
  }

  async uploadMedia(file: File, kind: UploadKind): Promise<string> {
    return this.uploadImage(file, kind);
  }

  // ---------------------------------------------------------------- feed

  async getFeed() {
    const me = this.db.currentUserId;
    return this.db.posts
      .filter((p) => !p.hidden)
      .filter((p) => !me || !this.isBlocked(me, p.authorId))
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async createPost(
    content: string,
    clubId?: string | null,
    options?: { category?: PostCategory | null; media?: PostMediaInput[] },
  ) {
    const me = this.requireUser();
    const clean = content.trim();
    if (!clean) throw new RepositoryError("INVALID", "empty");
    const postId = newId();
    this.db.posts.unshift({
      id: postId,
      authorId: me,
      content: clean,
      createdAt: iso(),
      likedBy: [],
      savedBy: [],
      clubId: clubId ?? null,
      category: options?.category ?? null,
      media: (options?.media ?? []).map((item, index) => ({
        id: newId(),
        postId,
        type: item.type,
        url: item.url,
        position: index,
      })),
    });
  }

  async updatePost(id: string, content: string) {
    const me = this.requireUser();
    const post = this.db.posts.find((p) => p.id === id);
    if (!post) throw new RepositoryError("INVALID", "not_found");
    if (post.authorId !== me) throw new RepositoryError("FORBIDDEN");
    post.content = content.trim();
  }

  async deletePost(id: string) {
    const me = this.requireUser();
    const post = this.db.posts.find((p) => p.id === id);
    if (!post) return;
    if (post.authorId !== me) throw new RepositoryError("FORBIDDEN");
    this.db.posts = this.db.posts.filter((p) => p.id !== id);
    this.db.comments = this.db.comments.filter((c) => c.postId !== id);
  }

  async toggleLike(postId: string) {
    const me = this.requireUser();
    const post = this.db.posts.find((p) => p.id === postId);
    if (!post) throw new RepositoryError("INVALID", "not_found");
    if (post.likedBy.includes(me)) {
      post.likedBy = post.likedBy.filter((id) => id !== me);
      return;
    }
    post.likedBy.push(me);
    if (post.authorId !== me) {
      this.notify({ userId: post.authorId, actorId: me, kind: "like", entityId: post.id });
    }
  }

  async toggleSave(postId: string) {
    const me = this.requireUser();
    const post = this.db.posts.find((p) => p.id === postId);
    if (!post) throw new RepositoryError("INVALID", "not_found");
    post.savedBy = post.savedBy.includes(me)
      ? post.savedBy.filter((id) => id !== me)
      : [...post.savedBy, me];
  }

  async listComments(postId: string) {
    return this.db.comments
      .filter((c) => c.postId === postId)
      .slice()
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  async addComment(postId: string, content: string, parentId?: string | null) {
    const me = this.requireUser();
    const post = this.db.posts.find((p) => p.id === postId);
    if (!post) throw new RepositoryError("INVALID", "not_found");
    const clean = content.trim();
    if (!clean) throw new RepositoryError("INVALID", "empty");
    const comment: Comment = {
      id: newId(),
      postId,
      authorId: me,
      content: clean,
      createdAt: iso(),
      parentId: parentId ?? null,
    };
    this.db.comments.push(comment);
    if (post.authorId !== me) {
      this.notify({
        userId: post.authorId,
        actorId: me,
        kind: "comment",
        entityId: post.id,
      });
    }
  }

  async deleteComment(id: string) {
    const me = this.requireUser();
    const comment = this.db.comments.find((c) => c.id === id);
    if (!comment) return;
    if (comment.authorId !== me) throw new RepositoryError("FORBIDDEN");
    this.db.comments = this.db.comments.filter((c) => c.id !== id);
  }

  // ---------------------------------------------------------------- stories

  async listStories() {
    this.pruneExpiredStories();
    return this.db.stories
      .slice()
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  async createStory(input: { text: string; background: string; imageUrl?: string | null }) {
    const me = this.requireUser();
    const story: Story = {
      id: newId(),
      authorId: me,
      text: input.text.trim(),
      background: input.background,
      imageUrl: input.imageUrl ?? null,
      createdAt: iso(),
      expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
      viewedBy: [me],
    };
    this.db.stories.push(story);
  }

  async deleteStory(id: string) {
    const me = this.requireUser();
    const story = this.db.stories.find((s) => s.id === id);
    if (!story) return;
    if (story.authorId !== me) throw new RepositoryError("FORBIDDEN");
    this.db.stories = this.db.stories.filter((s) => s.id !== id);
  }

  async markStoryViewed(id: string) {
    const me = this.db.currentUserId;
    if (!me) return;
    const story = this.db.stories.find((s) => s.id === id);
    if (!story) return;
    if (!story.viewedBy.includes(me)) story.viewedBy.push(me);
  }

  // ---------------------------------------------------------------- netmach

  async getMatchInterests(): Promise<MatchInterest[]> {
    return this.db.matchInterests.slice();
  }

  async getMatchState(): Promise<MatchState> {
    const me = this.requireUser();
    const likes = this.db.matchInterests.filter((m) => m.fromId === me).map((m) => m.toId);
    const likesOfMe = this.db.matchInterests.filter((m) => m.toId === me).map((m) => m.fromId);
    const passes = this.db.matchPasses.filter((m) => m.fromId === me).map((m) => m.toId);
    const mutual = likes.filter((id) => likesOfMe.includes(id));
    const candidates = this.db.profiles.filter(
      (p) =>
        p.id !== me &&
        p.onboarded &&
        !this.isBlocked(me, p.id) &&
        !likes.includes(p.id) &&
        !passes.includes(p.id) &&
        !this.isConnected(me, p.id),
    );
    const usedToday = this.db.matchInterests.filter(
      (m) => m.fromId === me && Date.parse(m.createdAt) >= startOfDay(),
    ).length;
    const map = (ids: string[]) =>
      ids.map((id) => this.profile(id)).filter((p): p is Profile => Boolean(p));
    return {
      candidates,
      matches: map(mutual),
      likesSent: likes,
      passes,
      usedToday,
      dailyLimit: FREE_NETMACH_DAILY_LIMIT,
    };
  }

  async likeProfile(targetId: string) {
    const me = this.requireUser();
    if (this.isBlocked(me, targetId)) throw new RepositoryError("BLOCKED");
    const usedToday = this.db.matchInterests.filter(
      (m) => m.fromId === me && Date.parse(m.createdAt) >= startOfDay(),
    ).length;
    if (usedToday >= FREE_NETMACH_DAILY_LIMIT) throw new RepositoryError("DAILY_LIMIT");
    if (!this.db.matchInterests.some((m) => m.fromId === me && m.toId === targetId)) {
      this.db.matchInterests.push({ fromId: me, toId: targetId, createdAt: iso() });
    }
    const matched = this.db.matchInterests.some((m) => m.fromId === targetId && m.toId === me);
    if (matched) {
      const existing = this.db.connections.find(
        (c) =>
          (c.requesterId === me && c.addresseeId === targetId) ||
          (c.requesterId === targetId && c.addresseeId === me),
      );
      if (!existing) {
        this.db.connections.push({
          id: newId(),
          requesterId: me,
          addresseeId: targetId,
          status: "accepted",
          createdAt: iso(),
        });
      } else if (existing.status !== "accepted") {
        existing.status = "accepted";
      }
      this.notify({ userId: targetId, actorId: me, kind: "match", entityId: targetId });
      this.notify({ userId: me, actorId: targetId, kind: "match", entityId: targetId });
    }
    return { matched };
  }

  async passProfile(targetId: string) {
    const me = this.requireUser();
    if (!this.db.matchPasses.some((m) => m.fromId === me && m.toId === targetId)) {
      this.db.matchPasses.push({ fromId: me, toId: targetId, createdAt: iso() });
    }
  }

  // ---------------------------------------------------------------- conexões

  async listConnections(): Promise<Connection[]> {
    const me = this.requireUser();
    return this.db.connections.filter((c) => c.requesterId === me || c.addresseeId === me);
  }

  async sendConnectionRequest(targetId: string) {
    const me = this.requireUser();
    if (me === targetId) throw new RepositoryError("INVALID", "self");
    if (this.isBlocked(me, targetId)) throw new RepositoryError("BLOCKED");
    const existing = this.db.connections.find(
      (c) =>
        (c.requesterId === me && c.addresseeId === targetId) ||
        (c.requesterId === targetId && c.addresseeId === me),
    );
    if (existing) {
      if (existing.status === "pending" && existing.addresseeId === me) {
        existing.status = "accepted";
        this.notify({ userId: targetId, actorId: me, kind: "connection", entityId: existing.id });
      }
      return;
    }
    const connection: Connection = {
      id: newId(),
      requesterId: me,
      addresseeId: targetId,
      status: "pending",
      createdAt: iso(),
    };
    this.db.connections.push(connection);
    this.notify({ userId: targetId, actorId: me, kind: "connection", entityId: connection.id });
  }

  async respondConnection(id: string, accept: boolean) {
    const me = this.requireUser();
    const connection = this.db.connections.find((c) => c.id === id);
    if (!connection) throw new RepositoryError("INVALID", "not_found");
    if (connection.addresseeId !== me) throw new RepositoryError("FORBIDDEN");
    if (accept) {
      connection.status = "accepted";
      this.notify({
        userId: connection.requesterId,
        actorId: me,
        kind: "connection",
        entityId: connection.id,
      });
    } else {
      this.db.connections = this.db.connections.filter((c) => c.id !== id);
    }
  }

  async removeConnection(id: string) {
    const me = this.requireUser();
    const connection = this.db.connections.find((c) => c.id === id);
    if (!connection) return;
    if (connection.requesterId !== me && connection.addresseeId !== me) {
      throw new RepositoryError("FORBIDDEN");
    }
    this.db.connections = this.db.connections.filter((c) => c.id !== id);
  }

  // ---------------------------------------------------------------- grupos

  async listClubs(): Promise<Club[]> {
    return this.db.clubs.slice();
  }

  async getClub(slug: string) {
    return this.db.clubs.find((c) => c.slug === slug) ?? null;
  }

  async joinClub(clubId: string) {
    const me = this.requireUser();
    const club = this.db.clubs.find((c) => c.id === clubId);
    if (!club) throw new RepositoryError("INVALID", "not_found");
    if (!club.memberIds.includes(me)) club.memberIds.push(me);
  }

  async leaveClub(clubId: string) {
    const me = this.requireUser();
    const club = this.db.clubs.find((c) => c.id === clubId);
    if (!club) return;
    if (club.adminIds.includes(me)) throw new RepositoryError("FORBIDDEN", "admin_cannot_leave");
    club.memberIds = club.memberIds.filter((id) => id !== me);
  }

  // ---------------------------------------------------------------- chat

  async listConversations(): Promise<Conversation[]> {
    const me = this.requireUser();
    return this.db.conversations
      .filter((c) => c.memberIds.includes(me))
      .slice()
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  async listMessages(conversationId: string): Promise<Message[]> {
    const me = this.requireUser();
    const conversation = this.db.conversations.find((c) => c.id === conversationId);
    if (!conversation || !conversation.memberIds.includes(me)) {
      throw new RepositoryError("FORBIDDEN");
    }
    return this.db.messages
      .filter((m) => m.conversationId === conversationId)
      .slice()
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  async sendMessage(conversationId: string, content: string) {
    const me = this.requireUser();
    const conversation = this.db.conversations.find((c) => c.id === conversationId);
    if (!conversation || !conversation.memberIds.includes(me)) {
      throw new RepositoryError("FORBIDDEN");
    }
    const other = conversation.memberIds.find((id) => id !== me);
    if (other && this.isBlocked(me, other)) throw new RepositoryError("BLOCKED");
    const clean = content.trim();
    if (!clean) throw new RepositoryError("INVALID", "empty");
    this.db.messages.push({
      id: newId(),
      conversationId,
      senderId: me,
      content: clean,
      createdAt: iso(),
      readBy: [me],
    });
    conversation.updatedAt = iso();
    if (other) {
      this.notify({ userId: other, actorId: me, kind: "message", entityId: conversationId });
    }
  }

  async startConversation(profileId: string) {
    const me = this.requireUser();
    if (this.isBlocked(me, profileId)) throw new RepositoryError("BLOCKED");
    const existing = this.db.conversations.find(
      (c) =>
        c.memberIds.length === 2 && c.memberIds.includes(me) && c.memberIds.includes(profileId),
    );
    if (existing) return existing.id;
    const conversation: Conversation = {
      id: newId(),
      memberIds: [me, profileId],
      updatedAt: iso(),
    };
    this.db.conversations.push(conversation);
    return conversation.id;
  }

  // ---------------------------------------------------------------- notificações

  async listNotifications() {
    const me = this.requireUser();
    return this.db.notifications
      .filter((n) => n.userId === me)
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async markNotificationsRead() {
    const me = this.requireUser();
    this.db.notifications.forEach((n) => {
      if (n.userId === me) n.read = true;
    });
  }

  // ---------------------------------------------------------------- perfil profissional

  async listRecommendations(profileId: string): Promise<Recommendation[]> {
    return this.db.recommendations.filter(
      (r) =>
        r.targetId === profileId &&
        (r.status === "accepted" ||
          r.authorId === this.db.currentUserId ||
          r.targetId === this.db.currentUserId),
    );
  }

  async requestRecommendation(targetId: string, content: string) {
    const me = this.requireUser();
    if (me === targetId) throw new RepositoryError("INVALID", "self");
    if (!this.isConnected(me, targetId)) throw new RepositoryError("FORBIDDEN", "not_connected");
    const clean = content.trim();
    if (!clean) throw new RepositoryError("INVALID", "empty");
    this.db.recommendations.push({
      id: newId(),
      authorId: me,
      targetId,
      content: clean,
      status: "pending",
      createdAt: iso(),
    });
    this.notify({ userId: targetId, actorId: me, kind: "recommendation", entityId: targetId });
  }

  async respondRecommendation(id: string, accept: boolean) {
    const me = this.requireUser();
    const recommendation = this.db.recommendations.find((r) => r.id === id);
    if (!recommendation) throw new RepositoryError("INVALID", "not_found");
    if (recommendation.targetId !== me) throw new RepositoryError("FORBIDDEN");
    recommendation.status = accept ? "accepted" : "declined";
  }

  async listCollaborations(profileId: string): Promise<Collaboration[]> {
    return this.db.collaborations.filter((c) => c.participantIds.includes(profileId));
  }

  async addCollaboration(input: {
    title: string;
    description: string;
    participantIds: string[];
    year: string;
  }) {
    const me = this.requireUser();
    const participants = Array.from(new Set([me, ...input.participantIds]));
    this.db.collaborations.push({
      id: newId(),
      title: input.title.trim(),
      description: input.description.trim(),
      participantIds: participants,
      confirmedIds: [me],
      year: input.year,
    });
  }

  async confirmCollaboration(id: string) {
    const me = this.requireUser();
    const collaboration = this.db.collaborations.find((c) => c.id === id);
    if (!collaboration) throw new RepositoryError("INVALID", "not_found");
    if (!collaboration.participantIds.includes(me)) throw new RepositoryError("FORBIDDEN");
    if (!collaboration.confirmedIds.includes(me)) collaboration.confirmedIds.push(me);
  }

  // ---------------------------------------------------------------- moderação

  async report(input: ReportInput) {
    const me = this.requireUser();
    this.db.reports.unshift({
      id: newId(),
      reporterId: me,
      targetType: input.targetType,
      targetId: input.targetId,
      category: input.category,
      description: input.description.trim(),
      status: "open",
      createdAt: iso(),
    });
  }

  async listReports(): Promise<Report[]> {
    const me = this.requireUser();
    const profile = this.profile(me);
    if (profile?.role !== "admin") throw new RepositoryError("FORBIDDEN");
    return this.db.reports.slice();
  }

  async blockUser(targetId: string) {
    const me = this.requireUser();
    if (me === targetId) throw new RepositoryError("INVALID", "self");
    if (!this.db.blocks.some((b) => b.blockerId === me && b.blockedId === targetId)) {
      this.db.blocks.push({ id: newId(), blockerId: me, blockedId: targetId, createdAt: iso() });
    }
    this.db.connections = this.db.connections.filter(
      (c) =>
        !(
          (c.requesterId === me && c.addresseeId === targetId) ||
          (c.requesterId === targetId && c.addresseeId === me)
        ),
    );
    this.db.matchInterests = this.db.matchInterests.filter(
      (m) =>
        !((m.fromId === me && m.toId === targetId) || (m.fromId === targetId && m.toId === me)),
    );
  }

  async unblockUser(targetId: string) {
    const me = this.requireUser();
    this.db.blocks = this.db.blocks.filter(
      (b) => !(b.blockerId === me && b.blockedId === targetId),
    );
  }

  async listBlocked(): Promise<Block[]> {
    const me = this.requireUser();
    return this.db.blocks.filter((b) => b.blockerId === me);
  }

  async listBlockedProfiles(): Promise<Profile[]> {
    const blocks = await this.listBlocked();
    return blocks.map((b) => this.profile(b.blockedId)).filter((p): p is Profile => Boolean(p));
  }

  // ---------------------------------------------------------------- canal oficial

  async getQuotes(): Promise<MarketQuote[]> {
    // Sem provedor configurado: a lista vazia é a resposta correta.
    return this.db.quotes.slice();
  }

  async getNews(): Promise<NewsItem[]> {
    return this.db.news.slice();
  }

  async getOfficialAnnouncements(): Promise<OfficialAnnouncement[]> {
    return this.db.officialAnnouncements.slice();
  }

  // ---------------------------------------------------------------- monetização

  async getSubscription(): Promise<Subscription> {
    const me = this.requireUser();
    return this.db.subscriptions[me] ?? { tier: "free", status: "active" };
  }

  async listPromotions(): Promise<Promotion[]> {
    const me = this.requireUser();
    return this.db.promotions.filter((p) => p.ownerId === me);
  }

  async createPromotion(_input: PromotionInput): Promise<void> {
    // Nenhum gateway definido: não simulamos campanha paga.
    throw new RepositoryError("PAYMENTS_UNAVAILABLE");
  }

  async listSavedSearches(): Promise<SavedSearch[]> {
    const me = this.requireUser();
    return this.db.savedSearches.filter((s) => s.userId === me);
  }

  async saveSearch(input: SavedSearchInput): Promise<void> {
    const me = this.requireUser();
    const subscription = this.db.subscriptions[me];
    if (subscription?.tier !== "premium") throw new RepositoryError("PREMIUM_REQUIRED");
    this.db.savedSearches.push({
      id: newId(),
      userId: me,
      name: input.name.trim(),
      skills: input.skills,
      goals: input.goals,
      experience: input.experience,
      createdAt: iso(),
    });
  }

  async deleteSavedSearch(id: string) {
    const me = this.requireUser();
    this.db.savedSearches = this.db.savedSearches.filter((s) => !(s.id === id && s.userId === me));
  }

  // ---------------------------------------------------------------- configurações / LGPD

  async getSettings(): Promise<UserSettings> {
    const me = this.requireUser();
    return this.settingsOf(me);
  }

  async updateSettings(patch: Partial<UserSettings>) {
    const me = this.requireUser();
    this.db.settings[me] = { ...this.settingsOf(me), ...patch };
  }

  async setLanguage(language: Language) {
    await this.updateSettings({ language });
  }

  async getTermsAcceptances(): Promise<TermsAcceptance[]> {
    const me = this.requireUser();
    return this.db.termsAcceptances.filter((t) => t.userId === me);
  }

  async acceptTerms(documents: TermsAcceptance["document"][]) {
    const me = this.requireUser();
    documents.forEach((document) => {
      this.db.termsAcceptances.push({
        userId: me,
        document,
        version: "2026-01",
        acceptedAt: iso(),
      });
    });
  }

  async getDeletionRequest(): Promise<DeletionRequest | null> {
    const me = this.requireUser();
    return this.db.deletionRequests.find((d) => d.userId === me) ?? null;
  }

  async requestAccountDeletion() {
    const me = this.requireUser();
    if (this.db.deletionRequests.some((d) => d.userId === me)) return;
    this.db.deletionRequests.push({
      id: newId(),
      userId: me,
      requestedAt: iso(),
      status: "pending",
    });
  }

  // ---------------------------------------------------------------- testes

  async getSnapshot() {
    return this.db;
  }
}

export function createDevRepository() {
  return new DevRepository();
}
