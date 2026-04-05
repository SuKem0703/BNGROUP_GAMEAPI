import { Entity, PrimaryColumn, Column } from 'typeorm';

export enum ItemType {
    QuestItem = 'QuestItem',
    Equipment = 'Equipment',
    Consumable = 'Consumable',
    Seed = 'Seed',
    Material = 'Material'
}

export enum ItemRarity {
    Rusty = 0,
    Common = 1,
    Refined = 2,
    Rare = 3,
    Relic = 4,
    Glacial = 5,
    Legendary = 6,
    Celestial = 7,
    Mythic = 8
}

export enum CurrencyType {
    Coin = 'Coin',
    Gem = 'Gem'
}

@Entity()
export class ItemDef {
    @PrimaryColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'enum', enum: ItemType })
    itemType!: ItemType;

    @Column({ default: true })
    isStackable!: boolean;

    @Column({ type: 'int', default: ItemRarity.Common })
    rarity!: number;

    @Column({ default: 0 })
    buyPrice!: number;

    @Column({ default: 0 })
    sellPrice!: number; 

    @Column({ type: 'enum', enum: CurrencyType, default: CurrencyType.Coin })
    currency!: CurrencyType;

    @Column({ nullable: true })
    imageUrl?: string;
}