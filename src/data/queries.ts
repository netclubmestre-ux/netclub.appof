import { queryOptions } from "@tanstack/react-query";
import { repository } from "./client";

/**
 * Chaves e consultas centralizadas. As telas usam estes `queryOptions`, então
 * trocar o repositório (demo -> Supabase) não exige mudança nos componentes.
 */

export const sessionQuery = queryOptions({
  queryKey: ["session"],
  queryFn: () => repository.getSession(),
});

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: () => repository.getCurrentProfile(),
});

export const peopleQuery = queryOptions({
  queryKey: ["people"],
  queryFn: () => repository.listProfiles(),
});

export const directoryQuery = queryOptions({
  queryKey: ["directory"],
  queryFn: () => repository.listDirectory(),
});

export const feedQuery = queryOptions({
  queryKey: ["feed"],
  queryFn: () => repository.getFeed(),
});

export const storiesQuery = queryOptions({
  queryKey: ["stories"],
  queryFn: () => repository.listStories(),
});

export const connectionsQuery = queryOptions({
  queryKey: ["connections"],
  queryFn: () => repository.listConnections(),
});

export const clubsQuery = queryOptions({
  queryKey: ["clubs"],
  queryFn: () => repository.listClubs(),
});

export const clubQuery = (slug: string) =>
  queryOptions({
    queryKey: ["club", slug],
    queryFn: () => repository.getClub(slug),
  });

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: () => repository.listNotifications(),
});

export const conversationsQuery = queryOptions({
  queryKey: ["conversations"],
  queryFn: () => repository.listConversations(),
});

export const messagesQuery = (conversationId: string) =>
  queryOptions({
    queryKey: ["messages", conversationId],
    queryFn: () => repository.listMessages(conversationId),
  });

export const conversationSummariesQuery = queryOptions({
  queryKey: ["conversations", "summaries"],
  queryFn: async () => {
    const conversations = await repository.listConversations();
    return Promise.all(
      conversations.map(async (conversation) => {
        const messages = await repository.listMessages(conversation.id);
        return { conversation, last: messages.at(-1) ?? null };
      }),
    );
  },
});

export const commentsQuery = (postId: string) =>
  queryOptions({
    queryKey: ["comments", postId],
    queryFn: () => repository.listComments(postId),
  });

export const matchStateQuery = queryOptions({
  queryKey: ["netmach"],
  queryFn: () => repository.getMatchState(),
});

export const profileQuery = (id: string) =>
  queryOptions({
    queryKey: ["profile", id],
    queryFn: () => repository.getProfile(id),
  });

export const recommendationsQuery = (profileId: string) =>
  queryOptions({
    queryKey: ["recommendations", profileId],
    queryFn: () => repository.listRecommendations(profileId),
  });

export const collaborationsQuery = (profileId: string) =>
  queryOptions({
    queryKey: ["collaborations", profileId],
    queryFn: () => repository.listCollaborations(profileId),
  });

export const subscriptionQuery = queryOptions({
  queryKey: ["subscription"],
  queryFn: () => repository.getSubscription(),
});

export const promotionsQuery = queryOptions({
  queryKey: ["promotions"],
  queryFn: () => repository.listPromotions(),
});

export const savedSearchesQuery = queryOptions({
  queryKey: ["saved-searches"],
  queryFn: () => repository.listSavedSearches(),
});

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: () => repository.getSettings(),
});

export const blockedProfilesQuery = queryOptions({
  queryKey: ["blocked"],
  queryFn: () => repository.listBlockedProfiles(),
});

export const termsAcceptancesQuery = queryOptions({
  queryKey: ["terms-acceptances"],
  queryFn: () => repository.getTermsAcceptances(),
});

export const deletionRequestQuery = queryOptions({
  queryKey: ["deletion-request"],
  queryFn: () => repository.getDeletionRequest(),
});

export const quotesQuery = queryOptions({
  queryKey: ["official", "quotes"],
  queryFn: () => repository.getQuotes(),
});

export const newsQuery = queryOptions({
  queryKey: ["official", "news"],
  queryFn: () => repository.getNews(),
});

export const announcementsQuery = queryOptions({
  queryKey: ["official", "announcements"],
  queryFn: () => repository.getOfficialAnnouncements(),
});

export const reportsQuery = queryOptions({
  queryKey: ["reports"],
  queryFn: () => repository.listReports(),
});
