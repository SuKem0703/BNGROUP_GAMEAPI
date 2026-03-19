import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('StorageItems')
export class StorageItem {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar' })
    accountId!: string;

    @Column({ type: 'varchar' })
    chestId!: string;

    @Column({ type: 'int' })
    itemId!: number;

    @Column({ type: 'int' })
    slotIndex!: number;

    @Column({ type: 'int' })
    quantity!: number;

    @Column({ type: 'int' })
    rarity!: number;

    @Column({ type: 'float' })
    qualityFactor!: number;

    @CreateDateColumn()
    depositedAt: Date = new Date();
}