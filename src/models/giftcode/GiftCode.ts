import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn
} from 'typeorm';
import { GiftCodeRedemption } from './GiftCodeRedemption';
import { GiftCodeReward } from './GiftCodeReward';

@Entity('GiftCodes')
@Unique(['code'])
export class GiftCode {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 80 })
    code: string = '';

    @Column({ type: 'varchar', length: 180, nullable: true })
    title?: string | null;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'boolean', default: true })
    isUnlimitedQuantity: boolean = true;

    @Column({ type: 'int', nullable: true })
    maxRedemptions?: number | null;

    @Column({ type: 'int', default: 0 })
    redeemedCount: number = 0;

    @Column({ type: 'boolean', default: true })
    isUnlimitedDuration: boolean = true;

    @Column({ type: 'datetime', nullable: true })
    expiresAt?: Date | null;

    @Column({ type: 'boolean', default: true })
    isActive: boolean = true;

    @Column({ type: 'boolean', default: false })
    publishToForum: boolean = false;

    @Column({ type: 'int', nullable: true })
    forumThreadId?: number | null;

    @Column({ type: 'varchar', nullable: true })
    createdByAccountId?: string | null;

    @OneToMany(() => GiftCodeReward, reward => reward.giftCode, { cascade: true })
    rewards!: GiftCodeReward[];

    @OneToMany(() => GiftCodeRedemption, redemption => redemption.giftCode)
    redemptions!: GiftCodeRedemption[];

    @CreateDateColumn()
    createdAt: Date = new Date();

    @UpdateDateColumn()
    updatedAt: Date = new Date();
}
