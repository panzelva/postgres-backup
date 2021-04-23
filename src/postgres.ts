import { spawn } from "child_process"
import { mkdir, readdir, rm } from "fs/promises"
import env from "./env"
import { logger } from "./logger"

async function isDirEmpty(dir: string) {
  const files = await readdir(dir)
  return files.length === 0
}

export async function createWorkDir() {
  logger.info(`Checking if ${env.WORK_DIR} is suitable for backup.`)
  await mkdir(env.WORK_DIR, { recursive: true })

  const isEmpty = await isDirEmpty(env.WORK_DIR)
  if (!isEmpty) {
    logger.error(`${env.WORK_DIR} is not empty, aborting!`)
    throw new Error("Work dir is not empty.")
  }
}

export async function cleanUpWorkDir() {
  logger.info(`Deleting ${env.WORK_DIR}`)
  await rm(env.WORK_DIR, { recursive: true, force: true })
}

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

  return new Promise((resolve, reject) => {
    const process = spawn(`pg_dump`, [`--version`])

    process.stdout.on("data", processData)
    process.stderr.on("data", processData)

    process.on("close", function (code) {
      logger.info("pg_dump --version finished successfully.")
      resolve(code)
    })

    process.on("error", function (err) {
      logger.error("pg_dump --version failed.")
      reject(err)
    })
  })
}

export async function dumpDatabase() {
  logger.info("Starting database dump.")

  return new Promise((resolve, reject) => {
    const process = spawn(
      `pg_dump`,
      [
        `--file`,
        env.WORK_DIR,
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
      logger.info("pg_dump finished successfully.")
      resolve(code)
    })

    process.on("error", function (err) {
      logger.error("pg_dump failed.")
      reject(err)
    })
  })
}
