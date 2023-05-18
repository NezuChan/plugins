import { Piece, PieceOptions } from "@sapphire/pieces";
import { Awaitable } from "@sapphire/utilities";

export abstract class Task extends Piece {
    public onLoad(): void {
        this.container.client.taskAmqp.on(this.name, this.run.bind(this));
    }

    public abstract run(data: unknown): Awaitable<unknown>;
}

export interface TaskOptions extends PieceOptions {
    name: string;
    type: "cron" | "delay";
    time: number | string;
    data?: unknown;
}
