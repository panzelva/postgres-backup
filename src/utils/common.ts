import { format } from "date-fns"
import { readdir, writeFile } from "fs/promises"
import path from "path"
import os from "os"

export function base64Decode(encoded: string) {
  return Buffer.from(encoded, "base64").toString("ascii")
}

export function notNullOrThrow<Input>(input: Input | undefined | null, errorMsg?: string): Input {
  if (input === undefined || input === null) {
    throw new Error(errorMsg ?? `Value cannot be null or undefined.`)
  }

  return input
}

export async function isDirEmpty(dir: string) {
  const files = await readdir(dir)
  return files.length === 0
}

export function getCurrentTime() {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
}

export function pathJoin(...segments: (string | undefined)[]) {
  return path.join(...segments.filter((item): item is string => !!item))
}

export async function createTestFile() {
  const testFileName = ".test"
  const testFilePath = pathJoin(os.tmpdir(), testFileName)
  await writeFile(testFilePath, "test")
  return { path: testFilePath, name: testFileName }
}
