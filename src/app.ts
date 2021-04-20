import { checkBucketForPermission, uploadDumpToBucket } from "./google"
import { checkPgDumpVersion, cleanUpWorkDir, createWorkDir, dumpDatabase } from "./postgres"
import env from "./utils/env"
import { logger } from "./utils/logger"

async function run() {
  logger.info("Starting postgres to gcp bucket backup utility.")
  logger.info("==============================================")
  logger.info("Current configuration")
  logger.info(`Work dir: ${env.WORK_DIR}`)
  logger.info("==============================================")
  logger.info("Google cloud")
  logger.info(`Bucket name: ${env.GCP_BUCKET_NAME}`)
  logger.info(`Backup folder in bucket: ${env.GCP_FOLDER}`)
  logger.info("==============================================")
  logger.info("Postgres")
  logger.info(`Database: ${env.PG_DATABASE}`)
  logger.info(`Host: ${env.PG_HOST}`)
  logger.info(`Port: ${env.PG_PORT}`)
  logger.info(`Username: ${env.PG_USERNAME}`)
  logger.info("==============================================")

  await checkBucketForPermission()
  await checkPgDumpVersion()
  await createWorkDir()

  await dumpDatabase()
  await uploadDumpToBucket()
  await cleanUpWorkDir()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
