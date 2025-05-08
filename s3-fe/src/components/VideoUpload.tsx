import { toast } from "sonner";
import { deleteVideoFromS3, getPresignedUrlForVideo } from "../api/s3Api";
import { useMultipartUpload } from "../hooks/useMultipartUpload";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";

export const VideoUpload = () => {
  const {
    key,
    upload,
    isPaused,
    togglePause,
    isUploading,
    error,
    partsProgress,
    overallProgress,
  } = useMultipartUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      upload(file);
    }
  };

  return (
    <div className="p-6">
      <Input type="file" accept="video/*" onChange={handleFileChange} />

      {isUploading && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-5">
            <Progress value={overallProgress} className="w-full" />
            <Button
              onClick={togglePause}
              className="px-4 py-2 text-sm font-medium rounded-md"
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
          </div>

          <div className="space-y-2">
            {partsProgress.map((part) => (
              <div key={part.partNumber} className="space-y-1">
                <div className="text-sm text-gray-600">
                  Part {part.partNumber} - {part.status}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      part.status === "failed"
                        ? "bg-red-600"
                        : part.status === "completed"
                        ? "bg-green-600"
                        : "bg-blue-600"
                    }`}
                    style={{ width: `${part.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {key && (
        <>
          <p className="mt-4 text-green-600">
            Upload completed! Video key: {key}
          </p>

          <div className="flex gap-4 mt-5">
            <Button
              onClick={async () => {
                try {
                  const response = await getPresignedUrlForVideo(key);
                  window.open(response.url, "_blank");
                } catch (err) {
                  console.error("Failed to get presigned URL:", err);
                }
              }}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-md"
            >
              View Video
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(key);
                toast("Video key copied to clipboard!");
              }}
              variant={"outline"}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-md"
            >
              Copy key
            </Button>
            <Button
              onClick={async () => {
                const response = await deleteVideoFromS3(key);
                toast.success(response);
              }}
              variant={"destructive"}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-md"
            >
              Delete video from S3
            </Button>
          </div>
        </>
      )}

      {error && (
        <p className="text-red-500 mt-2">Upload failed. Please try again.</p>
      )}
    </div>
  );
};
