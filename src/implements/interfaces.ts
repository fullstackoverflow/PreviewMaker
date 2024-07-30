export type Target = {
    bucket?: string
    path: string
    suffix?: string
}

export type ICommonOptions = {
    concurrency: number
}

export interface IStorageBackend {
    SavePreviewImage(path: Target, buf: Buffer): Promise<void>;
    GetObjectURL(path: Target): Promise<string>;
}