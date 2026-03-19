import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './Account';

@Entity('UserStats')
export class UserStat {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar' })
    accountId!: string;

    @ManyToOne(() => Account, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId' })
    account?: Account;

    @Column({ type: 'int', default: 1 })
    level: number = 1;

    @Column({ type: 'int', default: 0 })
    exp: number = 0;

    @Column({ type: 'int', default: 5 })
    potentialPoints: number = 5;

    @Column({ type: 'int', default: 0 })
    str: number = 0;

    @Column({ type: 'int', default: 0 })
    dex: number = 0;

    @Column({ type: 'int', default: 0 })
    int: number = 0; 

    @Column({ type: 'int', default: 0 })
    con: number = 0;

    @UpdateDateColumn()
    updatedAt: Date = new Date();
}