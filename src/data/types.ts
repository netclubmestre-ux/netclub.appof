/**
 * Tipos de domínio do NetClub.
 *
 * Esta é a fonte de verdade das telas. O backend (Supabase) deverá produzir
 * exatamente estas formas — assim a UI não precisa ser reescrita na integração.
 */

export type Experience = "beginner" | "intermediate" | "advanced";

export type SkillId =
  | "marketing"
  | "programming"
  | "design"
  | "ai"
  | "paidTraffic"
  | "video"
  | "copywriting"
  | "social"
  | "sales"
  | "entrepreneurship"
  | "content";

export type GoalId =
  "job" | "clients" | "partners" | "cofounder" | "mentors" | "learn" | "share" | "network";

export type ClubCategory =
  | "marketing"
  | "programming"
  | "design"
  | "ai"
  | "entrepreneurship"
  | "paidTraffic"
  | "content"
  | "digitalBusiness";

export type Role = "member" | "admin";

export type Language = "pt-BR" | "en" | "es";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  year?: string;
}

export interface ProfileLink {
  id: string;
  label: string;
  url: string;
}

export interface Profile {
  id: string;
  username: string;
  fullName: string;
  headline: string;
  area: string;
  bio: string;
  avatarUrl?: string | null;
  location: string;
  country: string;
  experience: Experience;
  skills: SkillId[];
  interests: SkillId[];
  goals: GoalId[];
  lookingFor: string;
  offering: string;
  portfolio: PortfolioItem[];
  links: ProfileLink[];
  onboarded: boolean;
  role: Role;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  likedBy: string[];
  savedBy: string[];
  clubId?: string | null;
  sponsored?: boolean;
  hidden?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
}

export interface Story {
  id: string;
  authorId: string;
  imageUrl?: string | null;
  text: string;
  /** Gradiente CSS usado quando não há imagem (demonstração local). */
  background: string;
  createdAt: string;
  expiresAt: string;
  viewedBy: string[];
  sponsored?: boolean;
}

export interface Connection {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted";
  createdAt: string;
}

export interface Conversation {
  id: string;
  memberIds: string[];
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

export interface Club {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ClubCategory;
  coverUrl?: string | null;
  adminIds: string[];
  memberIds: string[];
  rules: string[];
  createdAt: string;
}

export type NotificationKind =
  "like" | "comment" | "connection" | "match" | "message" | "club" | "recommendation";

export interface Notification {
  id: string;
  userId: string;
  actorId?: string | null;
  kind: NotificationKind;
  entityId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  authorId: string;
  targetId: string;
  content: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface Collaboration {
  id: string;
  title: string;
  description: string;
  participantIds: string[];
  confirmedIds: string[];
  year: string;
}

export type ReportTarget = "user" | "post" | "comment" | "story" | "club";

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTarget;
  targetId: string;
  category: string;
  description: string;
  status: "open" | "reviewing" | "resolved";
  createdAt: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export type MarketKind = "stock" | "crypto" | "fx";

/**
 * Cotação vinda de provedor externo. Quando `price` é `undefined` o dado está
 * indisponível — a UI nunca deve preencher com valores inventados.
 */
export interface MarketQuote {
  symbol: string;
  name: string;
  kind: MarketKind;
  price?: number;
  changePercent?: number;
  updatedAt?: string;
  source?: string;
  currency?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: "finance" | "digital" | "technology" | "ai" | "entrepreneurship";
  publishedAt: string;
  url: string;
}

export type PromotionTarget = "post" | "story";
export type PromotionStatus = "draft" | "active" | "ended";

export interface Promotion {
  id: string;
  ownerId: string;
  targetType: PromotionTarget;
  targetId: string;
  budget: number;
  startsAt: string;
  endsAt: string;
  status: PromotionStatus;
  views: number;
  interactions: number;
}

export interface Subscription {
  tier: "free" | "premium";
  status: "active" | "canceled" | "none";
  startedAt?: string;
  renewsAt?: string;
  endsAt?: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  skills: SkillId[];
  goals: GoalId[];
  experience: Experience | "any";
  createdAt: string;
}

export interface UserSettings {
  language: Language;
  profileVisibility: "public" | "members";
  showGoals: boolean;
  allowMessagesFrom: "connections" | "everyone";
  emailNotifications: boolean;
}

export interface MatchInterest {
  fromId: string;
  toId: string;
  createdAt: string;
}

export interface MatchPass {
  fromId: string;
  toId: string;
  createdAt: string;
}

export interface OfficialAnnouncement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface TermsAcceptance {
  userId: string;
  document: "terms" | "privacy" | "guidelines";
  version: string;
  acceptedAt: string;
}

export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: string;
  status: "pending" | "completed";
}

/** Estado completo do repositório de demonstração. */
export interface NetclubDb {
  currentUserId: string | null;
  profiles: Profile[];
  posts: Post[];
  comments: Comment[];
  stories: Story[];
  connections: Connection[];
  conversations: Conversation[];
  messages: Message[];
  clubs: Club[];
  notifications: Notification[];
  recommendations: Recommendation[];
  collaborations: Collaboration[];
  reports: Report[];
  blocks: Block[];
  matchInterests: MatchInterest[];
  matchPasses: MatchPass[];
  promotions: Promotion[];
  subscriptions: Record<string, Subscription>;
  savedSearches: SavedSearch[];
  settings: Record<string, UserSettings>;
  termsAcceptances: TermsAcceptance[];
  deletionRequests: DeletionRequest[];
  /** Cotações/notícias só existem quando um provedor está configurado. */
  quotes: MarketQuote[];
  news: NewsItem[];
  officialAnnouncements: OfficialAnnouncement[];
}

export const SKILLS: SkillId[] = [
  "marketing",
  "programming",
  "design",
  "ai",
  "paidTraffic",
  "video",
  "copywriting",
  "social",
  "sales",
  "entrepreneurship",
  "content",
];

export const GOALS: GoalId[] = [
  "job",
  "clients",
  "partners",
  "cofounder",
  "mentors",
  "learn",
  "share",
  "network",
];

export const CLUB_CATEGORIES: ClubCategory[] = [
  "marketing",
  "programming",
  "design",
  "ai",
  "entrepreneurship",
  "paidTraffic",
  "content",
  "digitalBusiness",
];

export const EXPERIENCES: Experience[] = ["beginner", "intermediate", "advanced"];

/** Limite diário do NetMach no plano gratuito. */
export const FREE_NETMACH_DAILY_LIMIT = 10;
