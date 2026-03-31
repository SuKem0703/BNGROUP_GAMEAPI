export interface ForumThreadSummary {
  id: number;
  title: string;
  content: string;
  preview: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
  postCount: number;
}

export interface ForumReply {
  id: number;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface ForumThreadDetail extends ForumThreadSummary {
  posts: ForumReply[];
}

export interface CreateThreadPayload {
  title: string;
  content: string;
}
