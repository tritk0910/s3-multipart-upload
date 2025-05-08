import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api/S3",
});

export interface UploadResponse {
  key: string;
  uploadId: string;
}

export interface PresignedUrlResponse {
  key: string;
  url: string;
}

export interface CompleteResponse {
  key: string;
  location: string;
}

export interface PartInfo {
  partNumber: number;
  eTag: string;
}

export const initiateUpload = async (fileName: string, contentType: string) => {
  const { data } = await api.post<UploadResponse>(
    `/start-multipart?fileName=${fileName}&contentType=${contentType}`
  );
  return data;
};

export const getPresignedUrl = async (
  key: string,
  uploadId: string,
  partNumber: number
) => {
  const { data } = await api.post<PresignedUrlResponse>(
    `/multipart/${key}/presigned-part?uploadId=${uploadId}&partNumber=${partNumber}`
  );
  return data;
};

export const uploadPartWithPresignedUrl = async (
  presignedUrl: string,
  chunk: Blob
) => {
  const response = await axios.put(presignedUrl, chunk, {
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  });

  if (response.status !== 200) {
    throw new Error("Failed to upload part");
  }

  const eTag = response.headers.etag?.replace(/['"]/g, "") ?? "";
  return { eTag };
};

export const completeUpload = async (
  key: string,
  uploadId: string,
  parts: PartInfo[]
) => {
  const { data } = await api.post<CompleteResponse>(
    `/multipart/${key}/complete`,
    { uploadId, parts }
  );
  return data;
};

export const getPresignedUrlForVideo = async (key: string) => {
  const { data } = await api.get<PresignedUrlResponse>(
    `/images/${key}/presigned`
  );
  return data;
}

export const deleteVideoFromS3 = async (key: string) => {
  const { data } = await api.delete<string>(
    `/images/${key}`
  );
  return data;
}