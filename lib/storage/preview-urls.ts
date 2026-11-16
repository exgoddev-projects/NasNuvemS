import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  createB2Client,
  getB2BucketName,
} from "@/lib/storage/providers/b2/client";

type PreviewSource = {
  mime_type: string | null;
  provider: string | null;
  provider_path: string | null;
};

export async function addPreviewUrls<T extends PreviewSource>(
  files: readonly T[]
): Promise<Array<T & { previewUrl: string | null }>> {
  const b2 = createB2Client();

  return Promise.all(
    files.map(async (file) => {
      const isPreviewable =
        file.mime_type?.startsWith("image/") ||
        file.mime_type?.startsWith("video/") ||
        file.mime_type?.startsWith("audio/");

      if (
        !isPreviewable ||
        file.provider !== "b2" ||
        !file.provider_path
      ) {
        return {
          ...file,
          previewUrl: null,
        };
      }

      const previewUrl = await getSignedUrl(
        b2,
        new GetObjectCommand({
          Bucket: getB2BucketName(),
          Key: file.provider_path,
        }),
        { expiresIn: 900 }
      );

      return {
        ...file,
        previewUrl,
      };
    })
  );
}
