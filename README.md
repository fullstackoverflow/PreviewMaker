# PreviewMaker

PreviewMaker 是一个对象存储插件(目前仅支持Minio),用于自动生成视频预览图像的工具。

## 部署

首先，准备好一个配置文件：

```json
{
    "ClientConfig": {
        "type": "minio",
        "endPoint": "127.0.0.1",
        "port": 9000,
        "useSSL": false,
        "accessKey": "admin",
        "secretKey": "123456"
    },
    "TargetConfig": {
        "path": "test_dir/",
        "bucket": "test_bucket",
        "suffix": ".mp4"
    },
    "CommonOptions": {
        "concurrency": 4
    }
}
```

在真正部署之前，请确保在 `config.json` 中正确配置了 Minio 客户端和其他必要的参数。

使用docker进行部署
```
docker run -v $(pwd)/config.json:/app/config.json tosee/preview_maker:v1.0.2 bash -c "node dist/index.js -c /app/config.json -p minio"
```

## 原理

使用Minio SDK提供的指定仓库，指定目录，指定后缀名的监听功能，监听对象创建事件，该事件触发时使用Minio SDK签名出一个临时可访问的url，再使用FFMPEG进行流式读取获取首帧并以同名+png后缀上传