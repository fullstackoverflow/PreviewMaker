import { existsSync, readFileSync, writeFileSync } from "fs";
import { setTimeout } from "timers/promises";

export type JSONPrimitive = string | number | boolean | null | JSONPrimitive[] | { [key: string]: JSONPrimitive; }

type ConsumerFn<T> = (data: T) => Promise<any>;

export enum TaskState {
    Waiting = 'waiting',
    Running = 'running'
}

export interface IConsumer<T> {
    fn: ConsumerFn<T>;
    concurrency: number;
}

export class Consumer<T> implements IConsumer<T> {
    fn: ConsumerFn<T>;
    concurrency: number;

    constructor(fn: ConsumerFn<T>, concurrency: number) {
        this.fn = fn;
        this.concurrency = concurrency;
    }
}

export class Task<T> {
    state: TaskState = TaskState.Waiting;

    constructor(public data: T) {

    }
}

export class MessageQueue<T extends JSONPrimitive> {
    private queue: Set<Task<T>> = new Set();
    private consumer: IConsumer<T>;
    private timer: Promise<void> | null = null;
    private concurrency: number = 0;

    constructor(private persists: string) {
        this.loadPersistedTasks();
    }

    private save() {
        const data = JSON.stringify(Array.from(this.queue).map(q => q.data));
        writeFileSync(this.persists, data);
    }

    private loadPersistedTasks() {
        if (existsSync(this.persists)) {
            const data = readFileSync(this.persists, 'utf-8');
            const datas: any[] = JSON.parse(data);
            datas.forEach(data => {
                this.queue.add(new Task(data));
            });
        }
    }

    close() {
        this.clear();
    }

    clear(): void {
        this.queue.clear();
    }

    // 入队操作
    enqueue(item: T): void {
        this.queue.add(new Task(item));
        this.save();
        /**
         * 避免一直循环调用,而是有数据进入时开启消费循环,当队列中的数据消费全部消费完后关闭循环,等待下一份数据进入
         * 避免频繁开关窗口时间为100ms
         */
        if (!this.timer) {
            this.timer = setTimeout(100).then(() => {
                this.consume();
            });
        }
    }

    registerConsunmer(consumer: IConsumer<T>): void {
        if (this.consumer != undefined) {
            throw new Error("only one consumer is allowed");
        }
        this.consumer = consumer;
        if (!this.timer) {
            this.timer = setTimeout(100).then(() => {
                this.consume();
            });
        }
    }

    // 消费
    private async consume() {
        while (!this.isEmpty()) {
            if (this.concurrency >= this.consumer.concurrency) {
                setImmediate(() => this.consume());
                return;
            }
            const task = Array.from(this.queue).find(i => i.state === TaskState.Waiting);
            if (!task) {
                setImmediate(() => this.consume());
                return;
            }
            task.state = TaskState.Running;
            this.consumer.fn(task.data).finally(() => {
                this.queue.delete(task);
                this.save();
                this.concurrency -= 1;
            });
            this.concurrency++;
        }
        if (!this.isEmpty()) {
            /**
             * 还有数据的情况下继续调用本方法
             */
            setImmediate(() => this.consume());
        } else {
            /**
             * 没数据了退出循环
             */
            this.timer = null;
        }
    }

    private isEmpty(): boolean {
        return this.queue.size === 0;
    }
}

export class Executor<T extends (...args: any[]) => any> {
    private queue: MessageQueue<any> = new MessageQueue(".persists.json");

    constructor(concurrency: number, fn: T) {
        const consumer = new Consumer(async (args: any[]) => {
            const [resolve, reject] = args.slice(0, 2);
            const params = args.slice(2);
            try {
                resolve(await fn(...params));
            } catch (e) {
                reject(e);
            }
        }, concurrency);
        this.queue.registerConsunmer(consumer);
    }

    async execute(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
        return await new Promise((resolve, reject) => {
            this.queue.enqueue([resolve, reject, ...args]);
        });
    }
}
