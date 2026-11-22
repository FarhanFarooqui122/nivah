export function NivahError({ error }: { error: string }) {
  return (
    <div className="border-2 border-red-500 bg-red-500/10 p-8 text-center">
      <p className="text-red-400">{error}</p>
    </div>
  );
}