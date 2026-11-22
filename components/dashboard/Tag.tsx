export function Tag({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 border border-[var(--color-border)] bg-zinc-900 text-[0.6rem] font-bold uppercase tracking-widest text-zinc-400">
      {text}
    </span>
  );
}