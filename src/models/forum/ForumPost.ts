import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from '../user/Account';
import { ForumThread } from './ForumThread';

@Entity('ForumPosts')
export class ForumPost {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'text' })
    content: string = '';

    @Column({ type: 'int' })
    threadId!: number;

    @ManyToOne(() => ForumThread, thread => thread.posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'threadId' })
    thread?: ForumThread;

    @Column({ type: 'varchar' })
    authorId!: string;

    @ManyToOne(() => Account)
    @JoinColumn({ name: 'authorId' })
    author?: Account;

    @CreateDateColumn()
    createdAt: Date = new Date();
}