import { Account } from '../user/Account';
import { ForumPost } from './ForumPost';

export class ForumThread {
    id!: number;
    title: string = '';
    content: string = '';
    authorId: string = '';
    author?: Account;
    createdAt: Date = new Date();
    viewCount: number = 0;
    posts: ForumPost[] = [];
}