import type {
  StorageProvider,
  StorageProviderType,
} from "@/lib/storage/types";

import {
  TeraBoxProvider,
} from "@/lib/storage/providers/terabox";

export function getStorageProvider(
  type: StorageProviderType
): StorageProvider {
  switch (type) {
    case "terabox":
      return new TeraBoxProvider();

    default:
      throw new Error(
        `Provider ${type} ainda nao implementado.`
      );
  }
}
