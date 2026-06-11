"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const sizeDimensions = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = name ? getInitials(name) : "?";
  const dimension = sizeDimensions[size];

  if (src && failedSrc !== src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-surface",
          sizeClasses[size],
          className
        )}
      >
        <Image
          src={src}
          alt={alt || name || "Avatar"}
          width={dimension}
          height={dimension}
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 font-semibold text-white",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

// Avatar Group
interface AvatarGroupProps {
  avatars: { src?: string | null; name?: string; alt?: string }[];
  max?: number;
  size?: AvatarProps["size"];
  className?: string;
}

export function AvatarGroup({ avatars, max = 4, size = "sm", className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-surface-hover font-medium text-muted-foreground ring-2 ring-background",
            sizeClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
