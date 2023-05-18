import { TaskAmqp } from "./Amqp/TaskAmqp.js";

export * from "./Amqp/TaskAmqp.js";
export * from "./Stores/Task.js";
export * from "./Stores/TaskStore.js";

declare module "@nezuchan/core" {
    interface Client {
        taskAmqp: TaskAmqp;
    }
}
