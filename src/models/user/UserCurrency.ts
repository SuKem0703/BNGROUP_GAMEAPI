import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './Account';

@Entity('UserCurrencies')
export class UserCurrency {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar' })
    accountId!: string;

    @ManyToOne(() => Account, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId' })
    account?: Account;

    @Column({ type: 'int', default: 0 })
    coin: number = 0;

    @Column({ type: 'int', default: 0 })
    gem: number = 0;

    @UpdateDateColumn()
    updatedAt: Date = new Date();
}