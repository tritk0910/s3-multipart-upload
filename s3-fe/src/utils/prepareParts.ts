export function prepareParts(file: File, partSize: number) {
  const parts = [];
  for (let i = 0; i < file.size; i += partSize) {
    parts.push({
      start: i,
      end: Math.min(i + partSize, file.size),
    });
  }
  return parts;
}