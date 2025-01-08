// src/components/ui/gpx-uploader.tsx
import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Upload } from 'lucide-react';
import type { MapRef } from './map-container';

interface GpxUploaderProps {
  mapRef: React.RefObject<MapRef>;
}

const GpxUploader: React.FC<GpxUploaderProps> = ({ mapRef }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setIsLoading(true);
    setError(null);

    try {
      // Check if map is ready
      if (!mapRef.current?.isReady()) {
        throw new Error('Map is not ready. Please wait a moment and try again.');
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        throw new Error('Please select a GPX file');
      }

      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      // Upload to map
      await mapRef.current.handleGpxUpload(content);
      
      // Clear input for future uploads
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading GPX:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload GPX file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute left-4 top-4 z-10">
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleClick}
          disabled={isLoading}
          variant="default"
          size="icon"
          className="h-10 w-10 bg-white hover:bg-gray-100"
        >
          {isLoading ? (
            <span className="animate-spin">
              <Upload className="h-4 w-4" />
            </span>
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default GpxUploader;