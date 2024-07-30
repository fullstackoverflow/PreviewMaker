import 'reflect-metadata';
import { existsSync, readFileSync } from "fs";
import { ICommonOptions, Target } from "./implements/interfaces";
import { MinioBackend } from "./implements/minio";
import { parseArgs } from "util";
import { plainToInstance } from "class-transformer";
import { Input, Platform } from "./dto/input";
import { validate, validateSync, ValidationError } from "class-validator";
import { Config, MinioClientConfig } from "./dto/config";

async function Load(platform: Platform, config: MinioClientConfig, target: Target, options: ICommonOptions) {
    switch (platform) {
        case Platform.Minio:
            const instance = new MinioBackend(config, options);
            instance.Watch(target);
            break;
        default:
            throw new Error("unknown platform");
    }
}

function extract_errors(errors: ValidationError[], props?: string[]): string[] {
    return errors
        .map((e) => {
            if (e.children && e.children.length > 0) {
                props = props || [];
                props.push(e.property);
                return extract_errors(e.children, props);
            } else {
                return {
                    ...e.constraints,
                    position: props ? props.join('.') : '.',
                };
            }
        })
        .flat(Infinity) as string[];
}

const options: {
    [key: string]: {
        type: 'string',
        short: string
    }
} = {
    config: {
        type: 'string',
        short: 'c'
    },
    platform: {
        type: 'string',
        short: 'p',
    },
};
const {
    values
} = parseArgs({ options });

const input = plainToInstance(Input, values);
{
    const errs = validateSync(input);
    if (errs.length > 0) {
        console.error(extract_errors(errs));
        process.exit();
    }
}

function ReadJSON(path: string) {
    try {
        return JSON.parse(readFileSync(path, { encoding: "utf8" }));
    } catch (e) {
        console.error("invalid config file");
        process.exit();
    }
}

const config: Config = plainToInstance(Config, ReadJSON(input.config));
{
    const errs = validateSync(config);
    if (errs.length > 0) {
        console.error(extract_errors(errs));
        process.exit();
    }
}

console.log(input);

console.log(config);

Load(input.platform, config.ClientConfig, config.TargetConfig, config.CommonOptions);

setInterval(() => {

}, 1000)