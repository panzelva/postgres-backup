import { mkdir, rm } from "fs/promises"
import got from "got"
import { checkPgDumpVersion, dumpDatabase } from "./database/postgres"
import { StorageClient, StorageDriver } from "./storage/base"
import { GoogleStorageClient } from "./storage/google"
import { S3StorageClient } from "./storage/s3"
import { isDirEmpty, notNullOrThrow } from "./utils/common"
import { env } from "./utils/env"
import { logger } from "./utils/logger"

async function createWorkDir() {
  logger.info(`Checking if ${env.WORK_DIR} is suitable for backup.`)
  await mkdir(env.WORK_DIR, { recursive: true })

  const isEmpty = await isDirEmpty(env.WORK_DIR)
  if (!isEmpty) {
    logger.error(`${env.WORK_DIR} is not empty, aborting!`)
    throw new Error("Work dir is not empty.")
  }
}

async function cleanUpWorkDir() {
  logger.info(`Deleting ${env.WORK_DIR}`)
  await rm(env.WORK_DIR, { recursive: true, force: true })
}

async function hearthbeatRequest() {
  const url = env.HEARTHBEAT_URL
  if (!url) {
    return
  }

  logger.info(`Making hearthbeat request to '${url}'`)
  await got.get(url)
}

function createStorageClient(): StorageClient {
  if (env.STORAGE_DRIVER === StorageDriver.Google) {
    return new GoogleStorageClient({
      bucketName: notNullOrThrow(env.GCP_BUCKET_NAME),
      privateKey: notNullOrThrow(env.GCP_SA_PRIVATE_KEY),
      bucketRootFolder: env.STORAGE_ROOT_FOLDER,
      clientEmail: env.GCP_SA_CLIENT_EMAIL,
    })
  }

  if (env.STORAGE_DRIVER === StorageDriver.S3) {
    return new S3StorageClient({
      accessKey: notNullOrThrow(env.S3_ACCESS_KEY),
      secretKey: notNullOrThrow(env.S3_SECRET_KEY),
      endpoint: notNullOrThrow(env.S3_HOST),
      region: env.S3_REGION,
      port: env.S3_PORT,
      ssl: env.S3_SSL,
      bucketName: notNullOrThrow(env.S3_BUCKET_NAME),
      bucketRootFolder: env.STORAGE_ROOT_FOLDER,
    })
  }

  throw new Error(`Invalid storage driver '${env.STORAGE_DRIVER}'`)
}

async function run() {
  logger.info(`Starting postgres backup utility.`)
  logger.info(`Using storage driver '${env.STORAGE_DRIVER}'`)

  await checkPgDumpVersion()

  const storageClient = createStorageClient()
  await storageClient.checkUploadPermissions()

  await createWorkDir()
  await dumpDatabase(env.WORK_DIR)

  await storageClient.uploadFolderContents(env.WORK_DIR)
  await cleanUpWorkDir()

  await hearthbeatRequest()
}

if (require.main === module) {
  // exit node process on unhandled promise rejections
  process.on("unhandledRejection", (error) => {
    throw error
  })

  run()
}
