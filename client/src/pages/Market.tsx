import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { useMarketUpdate } from "@/hooks/use-market-updates";

export default function Market() {
  const { data, isLoading } = useMarketUpdate("market");

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Business Lending Market</h1>
          <p className="text-slate-600">Daily market insights for borrowers, owners, and operators.</p>

          <Card className="p-6 md:p-8 border-slate-200 bg-white">
            {isLoading || !data ? (
              <p className="text-slate-500">Loading latest market update…</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{data.title}</h2>
                  <p className="text-slate-600 leading-relaxed">{data.summary}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Key Moves</h3>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    {data.bullets.map((bullet, index) => (
                      <li key={index}>{bullet}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">What It Means</h3>
                  <ul className="list-disc pl-6 space-y-2 text-slate-700">
                    {data.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-500">Updated: {new Date(data.updatedAt).toLocaleString()}</p>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
