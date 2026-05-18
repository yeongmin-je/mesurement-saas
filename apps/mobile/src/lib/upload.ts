// Upload a local file URI to an S3 presigned PUT URL.
// React Native's fetch supports uri-based bodies via FormData or a Blob shim.
export async function uploadToPresignedUrl(
  presignedUrl: string,
  fileUri: string,
  contentType: string,
): Promise<void> {
  const fileResponse = await fetch(fileUri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
  }
}
