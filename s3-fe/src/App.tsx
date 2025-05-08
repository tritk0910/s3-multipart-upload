import { VideoUpload } from "./components/VideoUpload";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-2xl mx-auto pt-10">
          <h1 className="text-2xl font-bold mb-6 text-center">Video Upload</h1>
          <VideoUpload />
        </div>
      </div>
      <Toaster expand={true} closeButton richColors position="top-right" />
    </>
  );
}
