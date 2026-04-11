import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, fadeIn } from "@/lib/animations";

interface FileUploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  accept: Record<string, string[]>;
  maxSize: number;
  label: string;
  description: string;
}

export function FileUploadZone({ onUpload, accept, maxSize, label, description }: FileUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    
    if (fileRejections.length > 0) {
      const error = fileRejections[0].errors[0];
      if (error.code === 'file-too-large') {
        setError(`File is too large. Max size is ${maxSize / (1024 * 1024)}MB`);
      } else if (error.code === 'file-invalid-type') {
        setError("Invalid file type.");
      } else {
        setError(error.message);
      }
      return;
    }

    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(acceptedFiles[0]);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className="relative">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out cursor-pointer group flex flex-col items-center justify-center text-center",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
          isUploading ? "opacity-50 pointer-events-none" : ""
        )}
      >
        <input {...getInputProps()} />
        
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors",
          isDragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          <UploadCloud className="w-6 h-6" />
        </div>
        
        <h4 className="text-sm font-semibold text-foreground mb-1">{label}</h4>
        <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
        
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center"
            >
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium text-primary animate-pulse">Uploading asset...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mt-3 flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
