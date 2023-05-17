import "./index.js";

import { FrameworkClient, Plugin, postInitialization, ClientOptions, postLogin } from "@nezuchan/framework";
import fastify from "fastify";
import { container } from "@sapphire/pieces";
import middie from "@fastify/middie";
import { RouteStore } from "./Stores/RouteStore.js";
import { PreHandlerStore } from "./Stores/PreHandlerStore.js";

export class Api extends Plugin {
    public static [postInitialization](this: FrameworkClient, options: ClientOptions): void {
        this.server = fastify(options.api);
        this.stores.register(new RouteStore());
        this.stores.register(new PreHandlerStore());
        container.server = this.server;
    }

    public static async [postLogin](this: FrameworkClient): Promise<void> {
        await this.server.register(middie);
        await this.server.listen({ port: this.options.api?.port ?? 3000, host: this.options.api?.host ?? "localhost" });
    }
}

FrameworkClient.plugins.registerPostInitializationHook(Api[postInitialization], "API-PostInitialization");
FrameworkClient.plugins.registerPostLoginHook(Api[postLogin], "API-PostLogin");
