import { IsDefined, IsEnum, IsNumber, IsPositive, IsString, ValidateNested, ValidationOptions } from "class-validator";

import { registerDecorator, ValidationArguments } from 'class-validator';
import { existsSync } from "fs";
import { Type, plainToInstance } from 'class-transformer';
import Minio from "minio";
import { ICommonOptions, Target } from "../implements/interfaces";

export abstract class IClientConfig {
    type: string
}

export class MinioClientConfig extends IClientConfig implements Minio.ClientOptions {

    @IsString()
    @IsDefined()
    endPoint: string;

    @IsString()
    @IsDefined()
    accessKey: string;

    @IsString()
    @IsDefined()
    secretKey: string;
}

export class CommonOptions implements ICommonOptions {
    @IsNumber()
    @IsDefined()
    @IsPositive()
    concurrency: number;
}

export class TargetConfig implements Target {
    @IsString()
    @IsDefined()
    path: string;

    @IsString()
    @IsDefined()
    bucket: string;

    @IsString()
    @IsDefined()
    suffix: string
}

export class Config {
    @Type(() => IClientConfig, {
        discriminator: {
            property: 'type',
            subTypes: [
                { value: MinioClientConfig, name: 'minio' },
            ],
        },
    })
    @IsDefined()
    @ValidateNested()
    ClientConfig: MinioClientConfig;

    @Type(() => TargetConfig)
    @IsDefined()
    @ValidateNested()
    TargetConfig: TargetConfig;

    @Type(() => CommonOptions)
    CommonOptions: CommonOptions
}