import { Request, Response } from 'express';

export class SaveDataController {
    public static uploadSaveData(req: Request, res: Response): void {
        const data = req.body;
        if (!data) {
            res.status(400).json("SaveData is null");
            return;
        }
        res.status(200).json({ message: "Save data received successfully!" });
    }
}