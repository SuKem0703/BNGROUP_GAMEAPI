export class ErrorViewModel {
    requestId?: string;

    get showRequestId(): boolean {
        return this.requestId !== undefined && this.requestId !== null && this.requestId !== '';
    }
}