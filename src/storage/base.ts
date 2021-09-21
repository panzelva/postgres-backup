export enum StorageDriver {
  Google = "google",
  S3 = "s3",
}

export interface StorageClient {
  checkUploadPermissions: () => Promise<void>
  uploadFolderContents: (folder: string) => Promise<void>
}
