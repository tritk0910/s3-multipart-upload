import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  completeUpload,
  initiateUpload,
  getPresignedUrl,
  uploadPartWithPresignedUrl,
} from "../api/s3Api";
import { prepareParts } from "../utils/prepareParts";

interface PartProgress {
  partNumber: number;
  progress: number;
  status: "pending" | "uploading" | "completed" | "failed";
}

export const useMultipartUpload = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [partsProgress, setPartsProgress] = useState<PartProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { uploadId, key } = await initiateUpload(file.name, file.type);

      const uploadedParts = [];
      let parts = [];
      let currentPart = 0;

      const partSize = 100 * 1024 * 1024;
      parts = prepareParts(file, partSize);

      while (currentPart < parts.length) {
        if (isPaused) {
          await new Promise((resolve) => {
            const checkPause = () => {
              if (!isPaused) resolve(true);
              else setTimeout(checkPause, 100);
            };
            checkPause();
          });
        }

        const part = parts[currentPart];
        const partFile = file.slice(part.start, part.end);
        const partNumber = currentPart + 1;

        setPartsProgress((prev) =>
          prev.map((p) =>
            p.partNumber === partNumber ? { ...p, status: "uploading" } : p
          )
        );

        try {
          // Get presigned URL for this part
          const { url } = await getPresignedUrl(key, uploadId, partNumber);

          // Upload the part using presigned URL
          const { eTag } = await uploadPartWithPresignedUrl(url, partFile);

          uploadedParts.push({
            partNumber,
            eTag,
          });

          setPartsProgress((prev) =>
            prev.map((p) =>
              p.partNumber === partNumber
                ? { ...p, progress: 100, status: "completed" }
                : p
            )
          );
        } catch (error) {
          setPartsProgress((prev) =>
            prev.map((p) =>
              p.partNumber === partNumber ? { ...p, status: "failed" } : p
            )
          );
          throw error;
        }

        currentPart++;
        setOverallProgress((currentPart / parts.length) * 100);
      }

      const result = await completeUpload(key, uploadId, uploadedParts);
      setOverallProgress(0);
      return result.key;
    },
  });

  const togglePause = () => setIsPaused((prev) => !prev);

  return {
    key: uploadMutation.data,
    upload: uploadMutation.mutate,
    isPaused,
    togglePause,
    isUploading: uploadMutation.isPending,
    error: uploadMutation.error,
    partsProgress,
    overallProgress,
  };
};
