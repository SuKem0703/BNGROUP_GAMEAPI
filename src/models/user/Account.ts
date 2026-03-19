import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { SaveData } from './SaveData';

export enum AccountStatus {
    None = 0,
    Warn = 1,
    Ban = 2,
    Unbanned = 3
}

@Entity('Accounts')
export class Account {
    @PrimaryColumn({ type: 'varchar' })
    id!: string; 

    @Column({ type: 'varchar' })
    username: string = '';

    @Column({ type: 'varchar' })
    email: string = '';

    @Column({ type: 'varchar' })
    passwordHash: string = '';

    @CreateDateColumn()
    createdAt: Date = new Date();

    @Column({ type: 'int', default: AccountStatus.None })
    status: AccountStatus = AccountStatus.None;

    @OneToOne(() => SaveData, saveData => saveData.account)
    saveData?: SaveData;
}