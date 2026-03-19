import { Account } from './Account';

export class UserCurrency {
    id!: number;
    accountId!: string;
    account?: Account;
    coin: number = 0;
    gem: number = 0;
    updatedAt: Date = new Date();
}