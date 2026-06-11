import SparkMD5 from "spark-md5";

/**
 * Base64 MD5 of a part's bytes — the `content-md5` header the `UploadPart`
 * proxy verifies (mismatch → 400 "Content-MD5 mismatch."). Web Crypto has no
 * MD5, hence spark-md5 (MIT). Parts are ≤ the configured part size, so a
 * single-shot ArrayBuffer hash is fine (no incremental streaming needed).
 */
export async function partMd5Base64(part: Blob): Promise<string> {
  const buffer = await part.arrayBuffer();
  const binaryDigest = SparkMD5.ArrayBuffer.hash(buffer, true);
  // raw=true yields a binary string; btoa encodes it to the header's base64.
  return btoa(binaryDigest);
}
