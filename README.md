# PreviewMaker

PreviewMaker 是一个对象存储插件(目前仅支持Minio),用于自动生成视频预览图像的工具。

## 部署

首先，准备好一个配置文件：

```json
{
    "ClientConfig": {
        "type": "minio",
        "endPoint": "192.168.0.117",
        "port": 9000,
        "useSSL": false,
        "accessKey": "admin",
        "secretKey": "gyxIsYeXG3g5V3M5"
    },
    "TargetConfig": {
        "path": "test_1/",
        "bucket": "test",
        "suffix": ".mp4"
    },
    "CommonOptions": {
        "concurrency": 10
    }
}
```

## 配置

在使用之前，请确保在 [`config.json`](command:_github.copilot.openRelativePath?%5B%7B%22scheme%22%3A%22file%22%2C%22authority%22%3A%22%22%2C%22path%22%3A%22%2Froot%2FPreviewMaker%2Fconfig.json%22%2C%22query%22%3A%22%22%2C%22fragment%22%3A%22%22%7D%5D "/root/PreviewMaker/config.json") 中正确配置了 Minio 客户端和其他必要的参数。

## 使用

运行以下命令来启动项目：

```sh
npm start
```

## 主要功能

- **视频上传处理**：当视频上传时，生成预览图像并保存到指定的存储桶中。
- **配置验证**：使用 `class-validator` 验证配置文件的正确性。

## 代码示例

以下是一个处理视频上传并生成预览图像的示例代码：

```ts
import { MinioBackend } from "./src/implements/minio";
import { Target } from "./src/implements/interfaces";

const minioBackend = new MinioBackend();

async function handleVideoUpload(target: Target) {
    await minioBackend.OnVideoUpload(target);
}

const target: Target = {
    bucket: "my-bucket",
    path: "path/to/video.mp4"
};

handleVideoUpload(target).catch(console.error);
```

## 依赖

- [`class-transformer`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Froot%2FPreviewMaker%2Fnode_modules%2Fclass-transformer%2Ftypes%2Findex.d.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "node_modules/class-transformer/types/index.d.ts")
- [`class-validator`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Froot%2FPreviewMaker%2Fnode_modules%2Fclass-transformer%2Ftypes%2Findex.d.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "node_modules/class-transformer/types/index.d.ts")
- [`minio`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Froot%2FPreviewMaker%2Fsrc%2Fimplements%2Fminio.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "src/implements/minio.ts")
- [`reflect-metadata`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Froot%2FPreviewMaker%2Fnode_modules%2Freflect-metadata%2Findex.d.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A16%2C%22character%22%3A0%7D%5D "node_modules/reflect-metadata/index.d.ts")

## 许可证

此项目遵循 ISC 许可证。