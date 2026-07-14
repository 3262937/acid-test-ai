import { FRAMEWORKS, FRAMEWORK_META, type Framework } from "./generators";

interface Props {
  value: Framework;
  onChange: (fw: Framework) => void;
  className?: string;
}

export function FrameworkPicker({ value, onChange, className }: Props) {
  return (
    <div className={`grid grid-cols-4 gap-1.5 ${className ?? ""}`}>
      {FRAMEWORKS.map((f) => {
        const active = value === f;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            title={`${f} · ${FRAMEWORK_META[f].lang}`}
            className={`rounded-md border px-1.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all ${
              active
                ? "border-acid/60 bg-acid/10 text-acid"
                : "border-white/10 bg-white/[0.02] text-muted-ink hover:text-ink"
            }`}
          >
            {FRAMEWORK_META[f].short}
          </button>
        );
      })}
    </div>
  );
}
