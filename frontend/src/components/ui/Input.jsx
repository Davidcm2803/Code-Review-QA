export default function Input({ placeholder, value, onChange, icon: Icon }) {
  return (
    <div className="relative flex items-center">
      {Icon && (
        <span className="absolute left-2 text-[var(--muted)] pointer-events-none">
          <Icon size={15} />
        </span>
      )}

      <input
        className={[
          "w-full h-10 bg-[var(--secondary)] border border-[var(--border)] rounded-md",
          "text-[var(--fg)] text-[13px] font-mono placeholder:text-[var(--muted)]",
          Icon ? "pl-7 pr-3" : "px-3",
        ].join(" ")}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
