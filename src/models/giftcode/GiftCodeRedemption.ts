import {
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    Column
} from 'typeorm';
import { GiftCode } from './GiftCode';
import { Account } from '../user/Account';

@Entity('GiftCodeRedemptions')
@Unique(['giftCodeId', 'accountId'])
export class GiftCodeRedemption {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    giftCodeId!: number;

    @ManyToOne(() => GiftCode, giftCode => giftCode.redemptions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'giftCodeId' })
    giftCode?: GiftCode;

    @Column({ type: 'varchar' })
    accountId!: string;

    @ManyToOne(() => Account, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId' })
    account?: Account;

    @CreateDateColumn()
    redeemedAt: Date = new Date();
}
