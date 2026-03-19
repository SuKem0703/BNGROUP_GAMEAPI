export class ShopLog {
    id!: number;
    accountId!: string;
    itemId!: number;
    quantity!: number;
    priceAtMoment!: number;
    currency!: string;
    totalCost!: number;
    date: Date = new Date();
}