export enum SaveReason {
    Manual,
    AutoSave,
    Checkpoint,
    SceneTransition,
    QuitGame,
    QuestHandIn,
    Death
}

export class SaveDataRequest {
    dataSave: string = '';
    reason: string = 'Manual';
}