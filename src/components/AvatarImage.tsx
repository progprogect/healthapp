'use client';

interface AvatarImageProps {
  src: string | null;
  alt: string;
  className: string;
}

export default function AvatarImage({ src, alt, className }: AvatarImageProps) {
  return (
    <img
      src={src || '/placeholder-avatar.png'}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
      }}
    />
  );
}

