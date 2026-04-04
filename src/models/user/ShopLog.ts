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

    @Column({ type: 'int', default: 0 })
    priceAtMoment!: number;

    @Column({ type: 'varchar', nullable: true })
    currency!: string;

    @Column({ type: 'int', default: 0 })
    totalCost!: number;

    @Column({ type: 'int', default: 0 })
    balanceBefore!: number;

    @Column({ type: 'int', default: 0 })
    balanceAfter!: number;

    @Column({ type: 'boolean', default: true })
    isSuccess!: boolean;

    @Column({ type: 'varchar', nullable: true })
    errorMessage!: string;

    @CreateDateColumn()
    date: Date = new Date();
}