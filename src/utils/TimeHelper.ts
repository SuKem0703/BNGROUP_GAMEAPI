export class TimeHelper {
    public static toVietnamTime(utcTime: Date): Date {
        // Múi giờ Việt Nam là UTC+7
        const vnOffset = 7 * 60 * 60 * 1000;
        return new Date(utcTime.getTime() + vnOffset);
    }

    public static getVietnamTime(): Date {
        return this.toVietnamTime(new Date());
    }
}