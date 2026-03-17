import { AwsV4Signer } from "aws4fetch";

interface PresignOpts {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  key: string;
  expiresIn?: number; // seconds, default 3600
}

export async function getPresignedUrl(opts: PresignOpts): Promise<string> {
  const {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    key,
    expiresIn = 3600,
  } = opts;

  const url = new URL(
    `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`
  );
  url.searchParams.set("X-Amz-Expires", String(expiresIn));

  const signer = new AwsV4Signer({
    accessKeyId,
    secretAccessKey,
    url,
    method: "GET",
    region: "auto",
    service: "s3",
    signQuery: true,
  });

  const signed = await signer.sign();
  return signed.url.toString();
}
