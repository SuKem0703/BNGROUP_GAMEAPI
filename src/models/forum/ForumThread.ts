import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Account } from '../user/Account';
import { ForumPost } from './ForumPost';

@Entity('ForumThreads')
export class ForumThread {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 200 })
    title: string = '';

    @Column({ type: 'text' })
    content: string = '';

    @Column({ type: 'varchar' })
    authorId!: string;

    @ManyToOne(() => Account)
    @JoinColumn({ name: 'authorId' })
    author?: Account;

    @CreateDateColumn()
    createdAt: Date = new Date();

    @Column({ type: 'int', default: 0 })
    viewCount: number = 0;

    @OneToMany(() => ForumPost, post => post.thread)
    posts!: ForumPost[];
}