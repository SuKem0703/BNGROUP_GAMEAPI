import { Account } from '../user/Account';
import { ForumThread } from './ForumThread';

export class ForumPost {
    id!: number;
    content: string = '';
    threadId!: number;
    thread?: ForumThread;
    authorId: string = '';
    author?: Account;
    createdAt: Date = new Date();
}