import clubTech from "@/assets/club-tech.jpg";
import clubCreators from "@/assets/club-creators.jpg";
import clubSustain from "@/assets/club-sustain.jpg";

export const avatar = (n: number) => `https://i.pravatar.cc/160?img=${n}`;

export type Person = {
  id: string;
  name: string;
  role: string;
  location: string;
  img: string;
  clubs: string[];
  mutual: number;
  tag: "nearby" | "suggested" | "new";
};

export const people: Person[] = [
  { id: "sofia", name: "Sofia Bennett", role: "Marketing Strategist", location: "Lisboa, PT", img: avatar(5), clubs: ["Tech Connect", "Creators Hub"], mutual: 3, tag: "suggested" },
  { id: "liam", name: "Liam Carter", role: "Product Designer", location: "London, UK", img: avatar(12), clubs: ["Design Community"], mutual: 7, tag: "nearby" },
  { id: "emma", name: "Emma Wilson", role: "Founder · SaaS", location: "Berlin, DE", img: avatar(9), clubs: ["Founders Circle"], mutual: 2, tag: "nearby" },
  { id: "olivia", name: "Olivia Brown", role: "Content Creator", location: "São Paulo, BR", img: avatar(45), clubs: ["Creators Hub"], mutual: 11, tag: "new" },
  { id: "noah", name: "Noah Adams", role: "AI Engineer", location: "Austin, US", img: avatar(33), clubs: ["AI Builders", "Tech Connect"], mutual: 4, tag: "suggested" },
  { id: "ava", name: "Ava Moreau", role: "Growth Lead", location: "Paris, FR", img: avatar(20), clubs: ["Marketing Minds"], mutual: 6, tag: "nearby" },
  { id: "james", name: "James Silva", role: "Investor", location: "Madrid, ES", img: avatar(60), clubs: ["Founders Circle"], mutual: 1, tag: "new" },
];

export const nearby = ["emma", "liam", "olivia", "noah", "ava", "james"]
  .map((id) => people.find((p) => p.id === id)!)
  .filter(Boolean);

export type Club = {
  id: string;
  name: string;
  category: string;
  members: string;
  online: number;
  growth: string;
  desc: string;
  cover: string;
  icon: string;
  accent: "green" | "gold";
};

export const clubs: Club[] = [
  { id: "tech-connect", name: "Tech Connect", category: "Technology", members: "12.4K", online: 342, growth: "+12%", desc: "Engenheiros, builders e curiosos discutindo o que vem a seguir.", cover: clubTech, icon: "</>", accent: "green" },
  { id: "creators-hub", name: "Creators Hub", category: "Creators", members: "8.7K", online: 218, growth: "+9%", desc: "Criadores trocando processo, audiência e monetização.", cover: clubCreators, icon: "◎", accent: "gold" },
  { id: "sustainable-future", name: "Sustainable Future", category: "Lifestyle", members: "6.1K", online: 97, growth: "+6%", desc: "Impacto, clima e negócios regenerativos.", cover: clubSustain, icon: "❉", accent: "green" },
  { id: "marketing-minds", name: "Marketing Minds", category: "Marketing", members: "9.3K", online: 154, growth: "+8%", desc: "Estratégia, branding e aquisição sem achismo.", cover: clubTech, icon: "◈", accent: "green" },
  { id: "founders-circle", name: "Founders Circle", category: "Business", members: "4.8K", online: 61, growth: "+14%", desc: "Fundadores em estágio inicial trocando bastidores.", cover: clubCreators, icon: "▲", accent: "gold" },
  { id: "ai-builders", name: "AI Builders", category: "Technology", members: "15.2K", online: 488, growth: "+21%", desc: "Quem constrói com IA todos os dias.", cover: clubTech, icon: "✦", accent: "green" },
  { id: "design-community", name: "Design Community", category: "Design", members: "7.5K", online: 132, growth: "+5%", desc: "Craft, sistemas de design e portfólio.", cover: clubSustain, icon: "◇", accent: "green" },
];

export const categories = [
  "All", "Business", "Technology", "Marketing", "Creators", "Finance", "Design", "Fitness", "Gaming", "Lifestyle",
];

export type Post = {
  id: string;
  authorId: string;
  club: string;
  time: string;
  body: string;
  likes: number;
  comments: number;
};

export const posts: Post[] = [
  {
    id: "p1",
    authorId: "sofia",
    club: "Tech Connect",
    time: "2h atrás",
    body: "Loved today's discussion on building authentic personal brands. Here are 3 key takeaways that stood out to me...",
    likes: 128,
    comments: 24,
  },
  {
    id: "p2",
    authorId: "noah",
    club: "AI Builders",
    time: "5h atrás",
    body: "Shipped a small agent that cleans up my meeting notes. The trick was keeping the toolset tiny — 3 tools, nothing more.",
    likes: 86,
    comments: 12,
  },
  {
    id: "p3",
    authorId: "olivia",
    club: "Creators Hub",
    time: "ontem",
    body: "Consistency beats virality. 40 posts later, the compounding is real — and the DMs are where the opportunities actually happen.",
    likes: 204,
    comments: 37,
  },
];

export const conversations = [
  { id: "sofia", last: "Perfeito, te mando o deck hoje à noite 🙌", time: "09:24", unread: 2 },
  { id: "liam", last: "Aquele clube de design vale muito a pena", time: "Ontem", unread: 0 },
  { id: "emma", last: "Vamos marcar um café essa semana?", time: "Ontem", unread: 1 },
  { id: "olivia", last: "Obrigada pela indicação!", time: "Seg", unread: 0 },
];

export const messages: Record<string, { me: boolean; text: string; time: string }[]> = {
  sofia: [
    { me: false, text: "Oi Alex! Vi seu comentário no Tech Connect 👏", time: "09:02" },
    { me: true, text: "Valeu, Sofia! Curti demais sua thread sobre marca pessoal.", time: "09:10" },
    { me: false, text: "Perfeito, te mando o deck hoje à noite 🙌", time: "09:24" },
  ],
};

export const notifications = [
  { id: "n1", text: "Sofia aceitou seu pedido de conexão.", time: "agora", kind: "green" as const },
  { id: "n2", text: "Você tem uma nova sugestão de conexão.", time: "1h", kind: "gold" as const },
  { id: "n3", text: "Tech Connect tem uma nova discussão.", time: "3h", kind: "green" as const },
  { id: "n4", text: "Olivia mencionou você em um post.", time: "ontem", kind: "gold" as const },
];

export const me = {
  name: "Alex Ferreira",
  role: "Marketing Strategist",
  location: "Salvador, BR",
  img: avatar(68),
  bio: "Marketing strategist interested in technology, entrepreneurship and meaningful connections.",
  stats: { connections: 128, clubs: 4, posts: 23 },
  interests: ["Marketing", "Technology", "Entrepreneurship", "AI"],
  clubIds: ["tech-connect", "creators-hub", "marketing-minds", "ai-builders"],
};
