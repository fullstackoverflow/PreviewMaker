import { IsDefined, IsEnum, IsString, ValidationOptions } from "class-validator";

import { registerDecorator, ValidationArguments } from 'class-validator';
import { existsSync } from "fs";

export enum Platform {
    Minio = 'minio'
}

export function IsExists() {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isExists',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: {
                message: '$property file is not exists',
            },
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return existsSync(value);
                },
            },
        });
    };
}

export class Input {
    @IsString()
    @IsExists()
    config: string;
    
    @IsEnum(Platform)
    platform: Platform;
}