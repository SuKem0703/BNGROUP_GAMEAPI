import { Account } from './Account';

export class UserStat {
    id!: number;
    accountId!: string;
    account?: Account;
    level: number = 1;
    exp: number = 0;
    potentialPoints: number = 5;
    str: number = 0;
    dex: number = 0;
    int: number = 0; 
    con: number = 0;
    updatedAt: Date = new Date();
}