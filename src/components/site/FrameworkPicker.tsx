import { FRAMEWORKS, FRAMEWORK_META, type Framework } from "./generators";

interface Props {
  value: Framework;
  onChange: (fw: Framework) => void;
  className?: string;
}

export function FrameworkPicker({ value, onChange, className }: Props) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <label className="label-mono mb-1.5 block text-muted-ink">Framework</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Framework)}
        className="w-full appearance-none rounded-md border border-white/10 bg-carbon/60 px-3 py-2.5 pr-9 font-mono text-[12px] uppercase tracking-wider text-acid outline-none transition-colors hover:border-acid/40 focus:border-acid/60 focus:ring-2 focus:ring-acid/30"
      >
        {FRAMEWORKS.map((f) => (
          <option key={f} value={f} className="bg-carbon text-ink">
            {FRAMEWORK_META[f].short} · {FRAMEWORK_META[f].lang}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-[34px] font-mono text-[10px] text-acid">
        ▾
      </span>
    </div>
  );
}
