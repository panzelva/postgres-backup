import { readdir, readFile } from "fs/promises"
import { Client } from "minio"
import path from "path"
import { createTestFile, getCurrentTime, pathJoin } from "../utils/common"
import { env } from "../utils/env"
import { logger } from "../utils/logger"
import { StorageClient } from "./base"

type S3StorageConfig = {
  endpoint: string
  accessKey: string
  secretKey: string
  region?: string
  port?: number
  ssl?: boolean
  bucketName: string
  bucketRootFolder?: string
}

export class S3StorageClient implements StorageClient {
  client: Client
  config: S3StorageConfig

  constructor(config: S3StorageConfig) {
    this.config = config
    this.client = new Client({
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      endPoint: config.endpoint,
      port: config.port,
      region: config.region,
      useSSL: config.ssl,
    })
  }

  async checkUploadPermissions() {
    logger.info(`Checking if upload to storage is possible.`)

    const metaData = {
      "Content-Type": "application/octet-stream",
    }

    try {
      const testFile = await createTestFile()
      const bucketFilePath = pathJoin(this.config.bucketRootFolder, testFile.name)
      await this.client.fPutObject(this.config.bucketName, bucketFilePath, testFile.path, metaData)
    } catch (error) {
      logger.error("There was problem uploading to S3 bucket.")
      throw error
    }
  }

  async uploadFolderContents(workDir: string) {
    const currentTime = getCurrentTime()
    const files = await readdir(workDir)

    for (const fileName of files) {
      const bucketFilePath = pathJoin(this.config.bucketRootFolder, currentTime, fileName)
      const localFilePath = path.join(env.WORK_DIR, fileName)

      logger.info(`Uploading ${localFilePath} to ${bucketFilePath}`)

      const fileContent = await readFile(localFilePath)
      await this.client.putObject(this.config.bucketName, bucketFilePath, fileContent)
    }
  }
}
