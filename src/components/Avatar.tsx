interface AvatarProps {
  name: string;
  photo?: string | null;
  size?: number;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Avatar({ name, photo, size = 44 }: AvatarProps) {
  const style = { width: size, height: size };

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL, pas d'optimisation possible
      <img
        src={photo}
        alt={name}
        style={style}
        className="shrink-0 rounded-full object-cover ring-2 ring-white shadow-card"
      />
    );
  }

  return (
    <span
      style={{ ...style, fontSize: size * 0.36 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-aqua font-semibold text-white"
    >
      {initials(name)}
    </span>
  );
}
