export class ApiError extends Error {
    public constructor(message: string, public code?: number) {
        super(message);
        this.cause = this.constructor;
        this.message = message;
        this.name = "ApiError";
    }
}
