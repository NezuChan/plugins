import "./index.js";

import { FrameworkClient, Plugin, PluginHook, postInitialization, preSetupAmqp } from "@nezuchan/framework";
import { TaskStore } from "./Stores/TaskStore.js";
import { TaskAmqp } from "./Amqp/TaskAmqp.js";

export class Tasker extends Plugin {
    public static [postInitialization](this: FrameworkClient): void {
        this.stores.register(new TaskStore());
    }

    public static [preSetupAmqp](this: FrameworkClient): void {
        this.taskAmqp = new TaskAmqp(this);
    }
}

FrameworkClient.plugins.registerPostInitializationHook(Tasker[postInitialization], "Tasker-PostInitialization");
FrameworkClient.plugins.registerHook(Tasker[preSetupAmqp], PluginHook.PreSetupAmqp, "Tasker-PreSetupAmqp");
