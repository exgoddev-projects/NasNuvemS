import type {
  DownloadResult,
  StorageFile,
  StorageProvider,
  StorageQuota,
  UploadResult,
} from "@/lib/storage/types";

import {
  ProviderNotConfiguredError,
} from "@/lib/storage/errors";

export class TeraBoxProvider
  implements StorageProvider {
  readonly type = "terabox" as const;

  private notConfigured(): never {
    throw new ProviderNotConfiguredError(
      "TeraBox"
    );
  }

  async connect(): Promise<void> {
    this.notConfigured();
  }

  async disconnect(): Promise<void> {
    this.notConfigured();
  }

  async isConnected(): Promise<boolean> {
    return false;
  }

  async getQuota(): Promise<StorageQuota> {
    return this.notConfigured();
  }

  async list(
    _path: string
  ): Promise<StorageFile[]> {
    return this.notConfigured();
  }

  async upload(
    _file: File,
    _destinationPath: string
  ): Promise<UploadResult> {
    return this.notConfigured();
  }

  async download(
    _providerFileId: string
  ): Promise<DownloadResult> {
    return this.notConfigured();
  }

  async delete(
    _providerFileId: string
  ): Promise<void> {
    this.notConfigured();
  }

  async deleteMany(
    _providerFileIds: string[]
  ): Promise<void> {
    this.notConfigured();
  }

  async move(
    _providerFileIds: string[],
    _destinationPath: string
  ): Promise<void> {
    this.notConfigured();
  }

  async copy(
    _providerFileIds: string[],
    _destinationPath: string
  ): Promise<void> {
    this.notConfigured();
  }

  async rename(
    _providerFileId: string,
    _newName: string
  ): Promise<void> {
    this.notConfigured();
  }
}
