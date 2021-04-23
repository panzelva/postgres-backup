import { config } from "dotenv"
import { cleanEnv, port, str } from "envalid"
import path from "path"
import os from "os"

// This enables support for .env file
config()

// All env variables that we want to use must be defined here
// More info can be found here https://github.com/af/envalid
const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: "development" }),
  WORK_DIR: str({ default: path.join(os.tmpdir(), "dump") }),

  PG_DATABASE: str({ devDefault: "postgres" }),
  PG_PASSWORD: str({ devDefault: "postgres" }),
  PG_USER: str({ devDefault: "postgres" }),
  PG_HOST: str({ devDefault: "localhost" }),
  PG_PORT: port({ default: 5432 }),

  GCP_BUCKET_NAME: str(),
  GCP_FOLDER: str({ default: "backups" }),
  GCP_SA_PRIVATE_KEY: str({ desc: "Base64 encoded private key" }),
  GCP_SA_CLIENT_EMAIL: str(),
})

export default env
