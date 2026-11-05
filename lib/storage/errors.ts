export class StorageProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageProviderError";
  }
}

export class ProviderNotConfiguredError
  extends StorageProviderError {
  constructor(provider: string) {
    super(
      `O provider ${provider} ainda nao foi configurado.`
    );

    this.name = "ProviderNotConfiguredError";
  }
}
