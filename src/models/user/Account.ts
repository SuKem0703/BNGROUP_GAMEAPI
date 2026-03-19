import { SaveData } from './SaveData.js';
import { OneToOne } from 'typeorm';

export enum AccountStatus {
    None = 0,
    Warn = 1,
    Ban = 2,
    Unbanned = 3
}

export class Account {
    id?: string; 
    username: string = '';
    email: string = '';
    passwordHash: string = '';
    createdAt: Date = new Date();
    status: AccountStatus = AccountStatus.None;

    @OneToOne(() => SaveData, (saveData: SaveData) => saveData.account)
    saveData?: SaveData;
}