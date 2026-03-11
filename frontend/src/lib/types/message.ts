export type Message = {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  type: "text" | "gif";
  mediaUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author?: { username: string };
};
