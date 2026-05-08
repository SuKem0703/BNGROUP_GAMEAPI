export interface SaveGameRequest {
    dataSave: string;
    reason: string;
}

export interface SaveGameResponse {
    message: string;
    context: string;
    masterSeed: number;
}

export interface GetSaveDataResponse {
    dataSave: string;
    masterSeed: number;
}