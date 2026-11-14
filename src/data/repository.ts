import type {
  Block,
  Club,
  Collaboration,
  Comment,
  Connection,
  Conversation,
  DeletionRequest,
  Experience,
  GoalId,
  Language,
  MarketQuote,
  MatchInterest,
  Message,
  NetclubDb,
  NewsItem,
  Notification,
  OfficialAnnouncement,
  Post,
  PostCategory,
  Profile,
  Promotion,
  PromotionTarget,
  Recommendation,
  Report,
  ReportTarget,
  SavedSearch,
  SkillId,
  Story,
  Subscription,
  TermsAcceptance,
  UserSettings,
} from "./types";

export type RepositoryErrorCode =
  | "NOT_AUTHENTICATED"
  | "PREMIUM_REQUIRED"
  | "PAYMENTS_UNAVAILABLE"
  | "DAILY_LIMIT"
  | "BLOCKED"
  | "FORBIDDEN"
  | "INVALID"
  | "username_taken"
  | "empty"
  | "not_found"
  | "self"
  | "admin_cannot_leave"
  | "not_connected"
  | "BACKEND_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_CONFIRMED"
  | "EMAIL_TAKEN"
  | "WEAK_PASSWORD"
  | "NETWORK";

export class RepositoryError extends Error {
  constructor(
    public readonly code: RepositoryErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
}

export interface SignUpResult {
  /** `null` quando o Supabase exige confirmação por e-mail. */
  userId: string | null;
  needsConfirmation: boolean;
}

export type UploadKind = "avatar" | "portfolio" | "story" | "post";

export interface PostMediaInput {
  type: "image" | "video";
  url: string;
}

export interface CreatePostOptions {
  category?: PostCategory | null;
  media?: PostMediaInput[];
}

export interface OnboardingInput {
  fullName: string;
  username: string;
  headline: string;
  area: string;
  bio: string;
  avatarUrl?: string | null;
  location: string;
  experience: Experience;
  skills: SkillId[];
  interests: SkillId[];
  goals: GoalId[];
  lookingFor: string;
  offering: string;
}

export type ProfileUpdateInput = Partial<OnboardingInput> & {
  portfolio?: Profile["portfolio"];
  links?: Profile["links"];
};

export interface ReportInput {
  targetType: ReportTarget;
  targetId: string;
  category: string;
  description: string;
}

export interface PromotionInput {
  targetType: PromotionTarget;
  targetId: string;
  budget: number;
  days: number;
}

export interface SavedSearchInput {
  name: string;
  skills: SkillId[];
  goals: GoalId[];
  experience: Experience | "any";
}

export interface MatchState {
  candidates: Profile[];
  matches: Profile[];
  likesSent: string[];
  passes: string[];
  usedToday: number;
  dailyLimit: number;
}

/**
 * Contrato único de dados do NetClub.
 *
 * A UI só conhece esta interface. Hoje a implementação é `dev-repository`
 * (memória local, dados fictícios). Quando o Supabase exclusivo for autorizado,
 * basta implementar `supabase-repository` — nenhuma tela precisa mudar.
 *
 * Todas as operações são assíncronas de propósito, para que a troca por um
 * backend remoto não altere a assinatura usada pelos componentes.
 */
export interface NetclubRepository {
  readonly source: "demo" | "supabase";
  /** `true` quando os dados são locais e não persistem no servidor. */
  readonly isDemo: boolean;

  // Sessão
  getSession(): Promise<string | null>;
  /** Login real por e-mail e senha (Supabase). */
  signIn(email: string, password: string): Promise<string>;
  /** Cadastro real. Pode exigir confirmação por e-mail. */
  signUp(input: SignUpInput): Promise<SignUpResult>;
  /** Envia o link de recuperação de senha. */
  resetPassword(email: string): Promise<void>;
  /** Define a nova senha usando a sessão de recuperação. */
  updatePassword(password: string): Promise<void>;
  /** Sessão local de demonstração. */
  signInDemo(): Promise<string>;
  signUpDemo(fullName: string): Promise<string>;
  signOut(): Promise<void>;

  // Perfil
  getProfile(id: string): Promise<Profile | null>;
  listProfiles(): Promise<Profile[]>;
  /** Todos os perfis visíveis, incluindo o usuário atual (para exibir nomes). */
  listDirectory(): Promise<Profile[]>;
  getCurrentProfile(): Promise<Profile | null>;
  completeOnboarding(input: OnboardingInput): Promise<void>;
  updateProfile(input: ProfileUpdateInput): Promise<void>;
  /** Envia uma imagem para o Storage e devolve a URL pública. */
  uploadImage(file: File, kind: UploadKind): Promise<string>;
  /** Envia imagem ou vídeo para o Storage e devolve a URL pública. */
  uploadMedia(file: File, kind: UploadKind): Promise<string>;

  // Feed
  getFeed(): Promise<Post[]>;
  createPost(content: string, clubId?: string | null, options?: CreatePostOptions): Promise<void>;
  updatePost(id: string, content: string): Promise<void>;
  deletePost(id: string): Promise<void>;
  toggleLike(postId: string): Promise<void>;
  toggleSave(postId: string): Promise<void>;
  listComments(postId: string): Promise<Comment[]>;
  addComment(postId: string, content: string, parentId?: string | null): Promise<void>;
  deleteComment(id: string): Promise<void>;

  // Stories
  listStories(): Promise<Story[]>;
  createStory(input: { text: string; background: string; imageUrl?: string | null }): Promise<void>;
  deleteStory(id: string): Promise<void>;
  markStoryViewed(id: string): Promise<void>;

  // NetMach
  getMatchState(): Promise<MatchState>;
  likeProfile(targetId: string): Promise<{ matched: boolean }>;
  passProfile(targetId: string): Promise<void>;

  // Conexões
  listConnections(): Promise<Connection[]>;
  sendConnectionRequest(targetId: string): Promise<void>;
  respondConnection(id: string, accept: boolean): Promise<void>;
  removeConnection(id: string): Promise<void>;

  // Grupos
  listClubs(): Promise<Club[]>;
  getClub(slug: string): Promise<Club | null>;
  joinClub(clubId: string): Promise<void>;
  leaveClub(clubId: string): Promise<void>;

  // Chat
  listConversations(): Promise<Conversation[]>;
  listMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, content: string): Promise<void>;
  startConversation(profileId: string): Promise<string>;

  // Notificações
  listNotifications(): Promise<Notification[]>;
  markNotificationsRead(): Promise<void>;

  // Perfil profissional
  listRecommendations(profileId: string): Promise<Recommendation[]>;
  requestRecommendation(targetId: string, content: string): Promise<void>;
  respondRecommendation(id: string, accept: boolean): Promise<void>;
  listCollaborations(profileId: string): Promise<Collaboration[]>;
  addCollaboration(input: {
    title: string;
    description: string;
    participantIds: string[];
    year: string;
  }): Promise<void>;
  confirmCollaboration(id: string): Promise<void>;

  // Moderação e privacidade
  report(input: ReportInput): Promise<void>;
  listReports(): Promise<Report[]>;
  blockUser(targetId: string): Promise<void>;
  unblockUser(targetId: string): Promise<void>;
  listBlocked(): Promise<Block[]>;
  listBlockedProfiles(): Promise<Profile[]>;

  // Canal oficial
  getQuotes(): Promise<MarketQuote[]>;
  getNews(): Promise<NewsItem[]>;
  getOfficialAnnouncements(): Promise<OfficialAnnouncement[]>;

  // Monetização (sem pagamento real nesta fase)
  getSubscription(): Promise<Subscription>;
  listPromotions(): Promise<Promotion[]>;
  createPromotion(input: PromotionInput): Promise<void>;
  listSavedSearches(): Promise<SavedSearch[]>;
  saveSearch(input: SavedSearchInput): Promise<void>;
  deleteSavedSearch(id: string): Promise<void>;

  // Configurações e LGPD
  getSettings(): Promise<UserSettings>;
  updateSettings(patch: Partial<UserSettings>): Promise<void>;
  setLanguage(language: Language): Promise<void>;
  getTermsAcceptances(): Promise<TermsAcceptance[]>;
  acceptTerms(documents: TermsAcceptance["document"][]): Promise<void>;
  getDeletionRequest(): Promise<DeletionRequest | null>;
  requestAccountDeletion(): Promise<void>;

  /** Estado bruto — usado apenas por testes e pela tela de administração. */
  getSnapshot(): Promise<NetclubDb>;
  /** Entidades auxiliares expostas para telas específicas. */
  getMatchInterests(): Promise<MatchInterest[]>;
}
