const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "text-[15px]",
  lg: "text-lg",
  md: "text-2xl",
};

export function Logo({
  size = "sm",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={`font-display font-bold italic tracking-tight text-acid ${SIZE_CLASSES[size]} ${className}`}
    >
      AcidTest
    </span>
  );
}
