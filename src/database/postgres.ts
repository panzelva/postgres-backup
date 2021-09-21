import { spawn } from "child_process"
import { env } from "../utils/env"
import { logger } from "../utils/logger"

function processData(data: Buffer) {
  const lines = data
    .toString()
    .split(/(\r?\n)/g)
    .map((line) => line.trim())
    .filter((line) => line)

  for (const line of lines) {
    logger.info(line)
  }
}

export async function checkPgDumpVersion() {
  logger.info("Checking pg_dump version.")

  return new Promise<void>((resolve, reject) => {
    const process = spawn(`pg_dump`, [`--version`])

    process.stdout.on("data", processData)
    process.stderr.on("data", processData)

    process.on("close", function (code) {
      if (code !== 0) {
        reject("pg_dump returned non-zero code.")
        return
      }

      logger.info("pg_dump --version finished successfully.")
      resolve()
    })

    process.on("error", function (err) {
      logger.error("pg_dump --version failed.")
      reject(err)
    })
  })
}

export async function dumpDatabase(targetFolder: string) {
  logger.info("Starting database dump.")

  return new Promise<void>((resolve, reject) => {
    const process = spawn(
      `pg_dump`,
      [
        `--file`,
        targetFolder,
        `--verbose`,
        `--jobs`,
        `4`,
        `--format=directory`,
        `--host`,
        env.PG_HOST,
        `--port`,
        `${env.PG_PORT}`,
        `--username`,
        env.PG_USER,
        `--dbname`,
        env.PG_DATABASE,
      ],
      { env: { PGPASSWORD: env.PG_PASSWORD } }
    )

    process.stdout.on("data", processData)
    process.stderr.on("data", processData)

    process.on("close", function (code) {
      if (code !== 0) {
        reject("pg_dump returned non-zero code.")
        return
      }

      logger.info("pg_dump finished successfully.")
      resolve()
    })

    process.on("error", function (err) {
      logger.error("pg_dump failed.")
      reject(err)
    })
  })
}
