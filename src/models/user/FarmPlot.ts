import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('FarmPlots')
@Index(["accountId"]) 
export class FarmPlot {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 50 })
    accountId!: string;

    @Index() 
    @Column({ type: 'varchar', length: 50 })
    plotId!: string;

    @Column({ type: 'int' })
    seedItemId!: number;

    @Column({ type: 'datetime' })
    plantedAt!: Date; 

    @CreateDateColumn()
    updatedAt!: Date;
}