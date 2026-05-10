export interface PlantSeedRequestDTO {
    plotId: string;
    seedItemId: number;
}

export interface BulkHarvestRequestDTO {
    plotIds: string[];
}