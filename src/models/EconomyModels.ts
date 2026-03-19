export class SpendRequest {
    currencyType!: string;
    amount!: number;
    reason!: string;
}

export class EconomyResponse {
    success!: boolean;
    newBalance!: number;
    message!: string;
}