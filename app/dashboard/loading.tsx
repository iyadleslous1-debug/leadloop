export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-48 animate-pulse rounded-md bg-zinc-800" />
      <div className="h-5 w-72 animate-pulse rounded-md bg-zinc-800" />
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
