const preferredMimeTypes = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
] as const;

export function selectRecorderOptions(
  recorderApi: Pick<typeof MediaRecorder, "isTypeSupported"> | null,
): MediaRecorderOptions | undefined {
  if (!recorderApi?.isTypeSupported) return undefined;
  const mimeType = preferredMimeTypes.find((candidate) =>
    recorderApi.isTypeSupported(candidate),
  );
  return mimeType ? { mimeType, videoBitsPerSecond: 1_500_000 } : undefined;
}
