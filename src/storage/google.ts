import { Storage } from "@google-cloud/storage"
import { readdir } from "fs/promises"
import path from "path"
import { base64Decode, createTestFile, getCurrentTime, pathJoin } from "../utils/common"
import { env } from "../utils/env"
import { logger } from "../utils/logger"
import { StorageClient } from "./base"

type GoogleStorageConfig = {
  privateKey: string
  clientEmail?: string
  bucketName: string
  bucketRootFolder?: string
  projectId?: string
}

export class GoogleStorageClient implements StorageClient {
  client: Storage
  config: GoogleStorageConfig

  constructor(config: GoogleStorageConfig) {
    this.config = config
    this.client = new Storage({
      projectId: config.projectId,
      credentials: {
        type: "service_account",
        private_key: base64Decode(config.privateKey),
        client_email: config.clientEmail,
      },
    })
  }

  async checkUploadPermissions() {
    logger.info(`Checking if upload to storage is possible.`)

    try {
      const bucket = this.client.bucket(this.config.bucketName)
      const testFile = await createTestFile()
      await bucket.upload(testFile.path, { destination: pathJoin(this.config.bucketRootFolder, testFile.name) })
    } catch (error) {
      logger.error("There was problem uploading to Google Cloud Storage bucket.")
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
      await this.client.bucket(this.config.bucketName).upload(localFilePath, { destination: bucketFilePath })
    }
  }
}
