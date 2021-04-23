import { Storage } from "@google-cloud/storage"
import { format } from "date-fns"
import { readdir } from "fs/promises"
import path from "path"
import env from "./env"
import { logger } from "./logger"

function base64Decode(encoded: string) {
  return Buffer.from(encoded, "base64").toString("ascii")
}

function getGoogleCloudStorageClient() {
  const privateKey = base64Decode(env.GCP_SA_PRIVATE_KEY)
  const storage = new Storage({
    credentials: {
      type: "service_account",
      private_key: privateKey,
      client_email: env.GCP_SA_CLIENT_EMAIL,
    },
  })

  return storage
}

export async function checkBucketForPermission() {
  logger.info("Checking if having sufficient permissions to bucket.")
  const storage = getGoogleCloudStorageClient()

  try {
    const bucket = storage.bucket(env.GCP_BUCKET_NAME)
    await bucket.getFiles({ maxResults: 1 })
  } catch (error) {
    logger.error("There was problem accessing Google Cloud Storage bucket.")
    throw error
  }
}

export async function uploadDumpToBucket() {
  const storage = getGoogleCloudStorageClient()
  const currentTime = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")

  const files = await readdir(env.WORK_DIR)
  for (const fileName of files) {
    const bucketFilePath = path.join(env.GCP_FOLDER, currentTime, fileName)
    const localFilePath = path.join(env.WORK_DIR, fileName)

    logger.info(`Uploading ${localFilePath} to ${bucketFilePath}`)
    await storage.bucket(env.GCP_BUCKET_NAME).upload(localFilePath, { destination: bucketFilePath })
  }
}
