import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GiftCode } from './GiftCode';

@Entity('GiftCodeRewards')
export class GiftCodeReward {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    giftCodeId!: number;

    @ManyToOne(() => GiftCode, giftCode => giftCode.rewards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'giftCodeId' })
    giftCode?: GiftCode;

    @Column({ type: 'int' })
    itemId!: number;

    @Column({ type: 'int', default: 1 })
    quantity: number = 1;

    @Column({ type: 'int', default: 1 })
    rarity: number = 1;

    @Column({ type: 'float', default: 1 })
    qualityFactor: number = 1;
}
