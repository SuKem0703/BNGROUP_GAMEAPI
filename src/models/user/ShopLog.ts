import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ShopLogs')
export class ShopLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar' })
    accountId!: string;

    @Column({ type: 'int' })
    itemId!: number;

    @Column({ type: 'int' })
    quantity!: number;

    @Column({ type: 'int' })
    priceAtMoment!: number;

    @Column({ type: 'varchar' })
    currency!: string;

    @Column({ type: 'int' })
    totalCost!: number;

    @CreateDateColumn()
    date: Date = new Date();
}