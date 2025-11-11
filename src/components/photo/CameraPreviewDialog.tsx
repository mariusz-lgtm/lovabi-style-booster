import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Check } from "lucide-react";

interface CameraPreviewDialogProps {
  imagePreview: string;
  onAccept: () => void;
  onRetake: () => void;
}

export const CameraPreviewDialog = ({
  imagePreview,
  onAccept,
  onRetake
}: CameraPreviewDialogProps) => {
  return (
    <Dialog open={!!imagePreview} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Image Preview */}
        <div className="relative bg-black">
          <img
            src={imagePreview}
            alt="Camera preview"
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="p-6 flex gap-3 justify-center bg-card">
          <Button
            variant="outline"
            size="lg"
            onClick={onRetake}
            className="gap-2 flex-1 max-w-xs"
          >
            <Camera className="w-5 h-5" />
            Retake
          </Button>
          
          <Button
            variant="default"
            size="lg"
            onClick={onAccept}
            className="gap-2 flex-1 max-w-xs"
          >
            <Check className="w-5 h-5" />
            Use This Photo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
