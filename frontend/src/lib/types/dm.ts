export type DmParticipant = {
  id: string;
  username: string;
  status: string;
};

export type DirectConversation = {
  id: string;
  participant1Id: string;
  participant2Id: string;
  createdAt: string;
  participant1: DmParticipant;
  participant2: DmParticipant;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  author: {
    id: string;
    username: string;
  };
};
