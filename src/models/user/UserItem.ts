import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './Account';

@Entity('UserItems')
export class UserItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar' })
    accountId!: string;

    @ManyToOne(() => Account, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId' })
    account?: Account;

    @Column({ type: 'int' })
    itemId!: number;

    @Column({ type: 'int', default: 1 })
    quantity: number = 1;

    @Column({ type: 'int' })
    slotIndex!: number;

    @Column({ type: 'boolean', default: false })
    isEquipped: boolean = false;

    @Column({ type: 'int' })
    rarity!: number;

    @Column({ type: 'float' })
    qualityFactor!: number;

    @Column({ type: 'varchar', nullable: true })
    chestId?: string;

    @CreateDateColumn()
    createdAt: Date = new Date();
}