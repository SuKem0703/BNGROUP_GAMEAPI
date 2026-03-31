import { Entity, PrimaryColumn, Column, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Account } from './Account';

export enum SaveReason {
    Manual,
    AutoSave,
    Checkpoint,
    SceneTransition,
    QuitGame,
    QuestHandIn,
    Death
}


@Entity('SaveData')
export class SaveData {
    @PrimaryColumn({ type: 'varchar' })
    accountId!: string;

    @OneToOne(() => Account, account => account.saveData, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId' })
    account?: Account;

    @Column({ type: 'text', nullable: true })
    dataSave?: string;

    @UpdateDateColumn()
    lastUpdated: Date = new Date();
}