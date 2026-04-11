import { useMemo } from "react";
import { useDeviceCapability, getImageQuality } from "@/hooks/use-device-capability";
import { cn } from "@/lib/utils";

interface AdaptiveImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  srcSet?: string;
  priority?: boolean;
}

export function AdaptiveImage({
  src,
  alt,
  className,
  width,
  height,
  sizes,
  srcSet,
  priority = false,
}: AdaptiveImageProps) {
  const capability = useDeviceCapability();
  const { maxWidth } = getImageQuality(capability);

  const imgSizes =
    sizes ||
    (capability.screenType === "mobile"
      ? "100vw"
      : capability.screenType === "fold"
        ? "50vw"
        : capability.screenType === "tablet"
          ? "33vw"
          : "25vw");

  const adaptiveStyle = useMemo(
    () => ({ maxWidth: width ? Math.min(width, maxWidth) : maxWidth }),
    [width, maxWidth]
  );

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={imgSizes}
      srcSet={srcSet}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      style={adaptiveStyle}
      className={cn("max-w-full h-auto", className)}
    />
  );
}
