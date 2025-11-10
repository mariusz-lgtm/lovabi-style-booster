import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  mode: "enhance" | "virtual-tryon";
}

const LoadingState = ({ mode }: LoadingStateProps) => {
  const message = mode === "enhance" 
    ? "Enhancing your photo..." 
    : "Creating your virtual try-on... This may take 20-30 seconds";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 bg-card shadow-medium">
        <Skeleton className="w-full aspect-square rounded-lg" />
      </Card>
      
      <Card className="p-6 bg-card shadow-medium">
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-foreground text-center font-medium">{message}</p>
          <p className="text-foreground-secondary text-sm text-center max-w-xs">
            Please wait while we work our magic ✨
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoadingState;
