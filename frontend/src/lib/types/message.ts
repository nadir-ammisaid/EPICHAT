export type Reaction = {
  emoji: string;
  count: number;
  userIds: string[];
};

export type MessageType = "text" | "gif" | "system_new_member";

export type Message = {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  type: MessageType;
  mediaUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author?: { username: string };
  reactions?: Reaction[];
};
