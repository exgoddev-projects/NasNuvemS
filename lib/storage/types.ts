export type StorageProviderType =
  | "terabox"
  | "s3"
  | "r2"
  | "onedrive"
  | "sftp"
  | "other";

export type StorageFile = {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType?: string;
  isFolder: boolean;
};

export type StorageQuota = {
  used: number;
  total: number;
  free: number;
};

export type UploadResult = {
  providerFileId: string;
  providerPath: string;
  size: number;
};

export type DownloadResult = {
  url: string;
  expiresAt?: string;
};

export interface StorageProvider {
  readonly type: StorageProviderType;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  isConnected(): Promise<boolean>;

  getQuota(): Promise<StorageQuota>;

  list(path: string): Promise<StorageFile[]>;

  upload(
    file: File,
    destinationPath: string
  ): Promise<UploadResult>;

  download(
    providerFileId: string
  ): Promise<DownloadResult>;

  delete(
    providerFileId: string
  ): Promise<void>;

  deleteMany(
    providerFileIds: string[]
  ): Promise<void>;

  move(
    providerFileIds: string[],
    destinationPath: string
  ): Promise<void>;

  copy(
    providerFileIds: string[],
    destinationPath: string
  ): Promise<void>;

  rename(
    providerFileId: string,
    newName: string
  ): Promise<void>;
}
