import React, { useRef } from 'react';
import { Button } from './button';
import { Upload, Loader2 } from 'lucide-react';
import { useGpxProcessing, useRouteRendering } from '@/hooks';
import type { MapRef } from './map-container';
import { Alert } from '@/components/ui/alert';

interface GpxUploaderProps {
  mapRef: React.RefObject<MapRef>;
}

const GpxUploader: React.FC<GpxUploaderProps> = ({ mapRef }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processGpxFile, status: processingStatus } = useGpxProcessing();
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

      // Process the file
      const route = await processGpxFile(file);
      if (route) {
        addRouteToMap(route);
      }

      // Clear input for future uploads
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error processing GPX:', err);
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
          disabled={processingStatus.isProcessing}
          variant="default"
          size="icon"
          className="h-10 w-10 bg-white hover:bg-gray-100"
        >
          {processingStatus.isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
        
        {processingStatus.error && (
          <Alert variant="destructive" className="w-64">
            {processingStatus.error}
          </Alert>
        )}
      </div>
    </div>
  );
};

export default GpxUploader;