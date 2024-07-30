import { EventEmitter } from "stream";
import { ICommonOptions, IStorageBackend, Target } from "./interfaces";
import { Client, ClientOptions } from "minio";
import { exec } from "child_process";
import { basename, extname, format, parse } from "path";
import { readFileSync } from "fs";
import { Consumer, MessageQueue } from "../util/MessageQueue";
import { randomUUID } from "crypto";
import { unlink } from "fs/promises";
import { tmpdir } from "os";

type Record = {
    eventVersion: string,
    eventSource: string,
    awsRegion: string,
    eventTime: string,
    eventName: string,
    userIdentity: {
        principalId: string
    },
    requestParameters: {
        principalId: string,
        region: string,
        sourceIPAddress: string
    },
    responseElements: {
        "x-amz-id-2": string,
        "x-amz-request-id": string,
        "x-minio-deployment-id": string,
        "x-minio-origin-endpoint": string
    },
    s3: {
        s3SchemaVersion: string,
        configurationId: string,
        bucket: {
            name: string,
            ownerIdentity: {
                principalId: string
            },
            arn: string
        },
        object: {
            key: string,
            size: number,
            eTag: string,
            contentType: string,
            userMetadata: {
                "content-type": string
            },
            sequencer: string
        }
    },
    source: {
        host: string,
        port: string,
        userAgent: string
    }
}

export class MinioBackend implements IStorageBackend {
    private client: Client;

    private queue = new MessageQueue(".persists.json");

    constructor(config: ClientOptions, options: ICommonOptions) {
        this.client = new Client(config);
        const consumer = new Consumer(this.OnVideoUpload.bind(this), options.concurrency);
        this.queue.registerConsunmer(consumer);
    }

    Watch(target: Target) {
        if (!target.bucket) {
            throw new Error("bucket is required");
        }
        if (!target.suffix) {
            throw new Error("suffix is required");
        }
        const listener = this.client.listenBucketNotification(target.bucket, target.path, target.suffix, ['s3:ObjectCreated:*'])
        listener.on('notification', (record: Record) => {
            console.log("Object Created:", {
                bucket: record.s3.bucket.name,
                path: record.s3.object.key,
            })
            this.queue.enqueue({
                bucket: record.s3.bucket.name,
                path: record.s3.object.key,
            })
        });
        console.log("Start Listening");
    }

    async OnVideoUpload(target: Target) {
        let start = process.uptime();
        const url = await this.GetObjectURL(target);
        const image = `${tmpdir()}/${randomUUID()}.png`;
        const cmd = `ffmpeg -i "${url}" -y -vframes 1 -f image2 -vcodec png "${image}"`;
        await new Promise<void>((resolve, reject) => {
            exec(cmd, (err: any, stdout: any, stderr: any) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                resolve();
            });
        });
        console.log("process cost:", process.uptime() - start);
        start = process.uptime();
        const parsed_path = parse(target.path);
        const extension = ".png";
        parsed_path.ext = extension;
        parsed_path.base = parsed_path.name + extension;
        await this.SavePreviewImage({ ...target, path: format(parsed_path) }, readFileSync(image));
        await unlink(image);
        console.log("upload cost:", process.uptime() - start);
    }

    async SavePreviewImage(target: Target, buf: Buffer): Promise<void> {
        if (target.bucket === undefined) {
            throw new Error("bucket is required");
        }
        await this.client.putObject(target.bucket, target.path, buf);
    }

    async GetObjectURL(target: Target): Promise<string> {
        if (target.bucket === undefined) {
            throw new Error("bucket is required");
        }
        return this.client.presignedGetObject(target.bucket, target.path, 24 * 60 * 60);
    }
}