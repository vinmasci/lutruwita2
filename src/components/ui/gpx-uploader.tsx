import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Upload, Loader2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { GpxService } from '@/services/gpx-service';
import { GpxProcessor } from '@/services/gpx-processor';
import { useRouteRendering } from '@/hooks';
import type { MapRef } from './map-container';

interface GpxUploaderProps {
  mapRef: React.RefObject<MapRef>;
}

const GpxUploader: React.FC<GpxUploaderProps> = ({ mapRef }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addRouteToMap } = useRouteRendering(mapRef.current?.getMap() || null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Check if map is ready
      if (!mapRef.current?.isReady()) {
        throw new Error('Map is not ready. Please wait a moment and try again.');
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        throw new Error('Please select a GPX file');
      }

      setIsUploading(true);
      setError(null);

      // Step 1: Upload the file
      const uploadResult = await GpxService.uploadGpxFile(file);
      if (!uploadResult.success || !uploadResult.path) {
        throw new Error(uploadResult.error || 'Failed to upload GPX file');
      }

      // Step 2: Process the file
      const content = await file.text();
      const processor = new GpxProcessor();
      const processedRoute = await processor.processGpx(Buffer.from(content), file.name);

      // Step 3: Add the processed route to the map
      addRouteToMap({
        ...processedRoute,
        gpxFilePath: uploadResult.path
      });

      // Clear input for future uploads
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error processing GPX:', err);
      setError(err instanceof Error ? err.message : 'Failed to process GPX file');
    } finally {
      setIsUploading(false);
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
          disabled={isUploading}
          variant="default"
          size="icon"
          className="h-10 w-10 bg-white hover:bg-gray-100"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
        
        {error && (
          <Alert variant="destructive" className="w-64">
            {error}
          </Alert>
        )}
      </div>
    </div>
  );
};

export default GpxUploader;
