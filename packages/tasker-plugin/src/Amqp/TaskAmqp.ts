/* eslint-disable no-async-promise-executor */
import EventEmitter from "node:events";
import { Result } from "@sapphire/result";
import { Channel } from "amqplib";
import { randomUUID } from "node:crypto";
import { RabbitMQ } from "@nezuchan/constants";
import { RoutingKey } from "@nezuchan/utilities";
import { FrameworkClient } from "@nezuchan/framework";

export class TaskAmqp extends EventEmitter {
    public replyTo: string | null = null;
    public constructor(
        private readonly client: FrameworkClient
    ) {
        super();
    }

    public async setup(client: FrameworkClient, channel: Channel): Promise<void> {
        await channel.assertExchange(RabbitMQ.TASKS_EXCHANGE, "direct", { durable: false });
        const { queue } = await channel.assertQueue("", { exclusive: true });

        await client.bindQueue(channel, queue, RabbitMQ.TASKS_EXCHANGE);
        await this.client.amqp.assertQueue(RabbitMQ.TASKS_SEND, { durable: false });

        await Result.fromAsync(() => channel.consume(queue, message => {
            if (message) {
                const payload = JSON.parse(message.content.toString()) as { t: string; d: unknown };
                this.emit(payload.t, payload.d);
            }
        }));
    }

    public async sendTask<T>(task: string, guildId: string, time: number, data: unknown): Promise<T> {
        const { queue: replyTo } = await this.client.amqp.assertQueue("", { exclusive: true });

        const correlationId = randomUUID();
        const shardCount = await this.client.fetchShardCount();
        const currentShardId = Number(BigInt(guildId) >> 22n) % shardCount;

        await this.client.amqp.sendToQueue(RabbitMQ.TASKS_SEND, Buffer.from(JSON.stringify({
            t: task,
            d: {
                time,
                data,
                route: RoutingKey(this.client.clientId, currentShardId)
            }
        })), {
            correlationId,
            replyTo
        });

        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Did not receive a response in 5 seconds"));
            }, 5000);
            return this.client.amqp.consume(replyTo, message => {
                if (message.properties.correlationId === correlationId) {
                    clearTimeout(timeout);
                    resolve(JSON.parse(message.content.toString()) as T);
                    this.client.amqp.ack(message);
                }
            }).then(({ consumerTag }) => {
                void this.client.amqp.cancel(consumerTag);
            });
        });
    }
}
