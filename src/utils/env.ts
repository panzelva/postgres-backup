import { config } from "dotenv"
import { bool, cleanEnv, port, str, url } from "envalid"
import path from "path"
import os from "os"
import { StorageDriver } from "../storage/base"

function getEnv() {
  // This enables support for .env file
  config()

  const commonEnv = cleanEnv(process.env, {
    NODE_ENV: str({ default: "development" }),
    WORK_DIR: str({ default: path.join(os.tmpdir(), "dump") }),

    PG_DATABASE: str({ devDefault: "postgres" }),
    PG_PASSWORD: str({ devDefault: "postgres" }),
    PG_USER: str({ devDefault: "postgres" }),
    PG_HOST: str({ devDefault: "localhost" }),
    PG_PORT: port({ default: 5432 }),

    STORAGE_DRIVER: str({ default: StorageDriver.Google, choices: [StorageDriver.Google, StorageDriver.S3] }),
    STORAGE_ROOT_FOLDER: str({ default: "pgbackup" }),
    HEARTHBEAT_URL: url({ default: undefined }),
  })

  return {
    ...(commonEnv.STORAGE_DRIVER === "google" &&
      cleanEnv(process.env, {
        GCP_BUCKET_NAME: str({ default: undefined }),
        GCP_PROJECT_ID: str(),
        GCP_SA_PRIVATE_KEY: str({ default: undefined, desc: "Base64 encoded private key" }),
        GCP_SA_CLIENT_EMAIL: str({ default: undefined }),
      })),
    ...(commonEnv.STORAGE_DRIVER === "s3" &&
      cleanEnv(process.env, {
        S3_HOST: str(),
        S3_PORT: port(),
        S3_REGION: str({ default: undefined }),
        S3_ACCESS_KEY: str(),
        S3_SECRET_KEY: str(),
        S3_BUCKET_NAME: str(),
        S3_SSL: bool({ default: true }),
      })),
    ...commonEnv,
  }
}

export const env = getEnv()
