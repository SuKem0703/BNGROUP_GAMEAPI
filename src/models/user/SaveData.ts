import { Account } from './Account.js';
import { OneToOne, JoinColumn } from 'typeorm';

export class SaveData {
    accountId: string = '';
    dataSave?: string;
    lastUpdated: Date = new Date();

    @OneToOne(() => Account, (account: Account) => account.saveData, { onDelete: "CASCADE" })
    @JoinColumn({ name: "accountId" })
    account?: Account;
}