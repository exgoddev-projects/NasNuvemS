import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Variavel de ambiente ${name} nao configurada.`
    );
  }

  return value;
}

export function createB2Client() {
  return new S3Client({
    endpoint: required("B2_ENDPOINT"),
    region: required("B2_REGION"),

    credentials: {
      accessKeyId: required(
        "B2_APPLICATION_KEY_ID"
      ),

      secretAccessKey: required(
        "B2_APPLICATION_KEY"
      ),
    },
  });
}

export function getB2BucketName() {
  return required("B2_BUCKET_NAME");
}
