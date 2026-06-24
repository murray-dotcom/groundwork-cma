export default function CMALoading() {
  return (
    <main className="min-h-screen bg-off-white py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="bg-olive rounded-t-lg px-8 py-5 flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-cream/20 rounded animate-pulse" />
            <div className="h-4 w-20 bg-cream/10 rounded animate-pulse" />
          </div>
          <div className="space-y-2 items-end flex flex-col">
            <div className="h-4 w-56 bg-cream/20 rounded animate-pulse" />
            <div className="h-3 w-44 bg-cream/10 rounded animate-pulse" />
          </div>
        </div>

        {/* Subject strip skeleton */}
        <div className="bg-white border border-sage/20 rounded-lg grid grid-cols-4 divide-x divide-sage/20">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-4 space-y-2">
              <div className="h-3 w-20 bg-sage/20 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-white border border-sage/20 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-sage/20">
            <div className="h-3 w-36 bg-olive/20 rounded animate-pulse" />
          </div>
          <div className="bg-olive h-10" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-11 px-4 flex items-center gap-4 ${i % 2 === 0 ? "bg-white" : "bg-cream/40"}`}
            >
              {[130, 60, 40, 40, 80, 60, 80].map((w, j) => (
                <div
                  key={j}
                  style={{ width: w }}
                  className="h-3 bg-gray-200/70 rounded animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Price panels skeleton */}
        <div>
          <div className="h-3 w-56 bg-olive/20 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-3 gap-4">
            {["bg-sage", "bg-olive", "bg-bronze"].map((bg) => (
              <div key={bg} className={`${bg} rounded-lg p-6 text-center space-y-3`}>
                <div className="h-3 w-20 bg-cream/20 rounded animate-pulse mx-auto" />
                <div className="h-7 w-32 bg-cream/20 rounded animate-pulse mx-auto" />
                <div className="h-3 w-16 bg-cream/10 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Narrative skeleton */}
        <div className="bg-white border border-sage/20 rounded-lg p-6 space-y-3">
          <div className="h-3 w-80 bg-olive/20 rounded animate-pulse" />
          <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </main>
  );
}
