import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

export default function AffiliateDisclosure() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Affiliate Disclosure</h1>
          <p className="text-slate-600">
            We believe in clear and transparent disclosures so you can understand how this website operates.
          </p>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <p className="text-slate-700 leading-relaxed">
              PennyFloat, operated by MD Media LLC, reviews and compares cash advance apps and lending services. Some links on this website are affiliate links,
              which means we may earn a commission if you click a link and complete certain actions.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Commissions help support our website and educational content. They do not change our commitment to publishing
              clear, useful comparisons.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">How Rankings and Reviews Work</h2>
            <p className="text-slate-700 leading-relaxed">
              Compensation does not determine our editorial intent. We aim to explain products in plain English and present
              practical details borrowers should review before applying.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Rankings and reviews may consider factors such as product features, costs, disclosures, and user relevance.
              Sponsored relationships may be present, but they do not guarantee placement or outcomes.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Important Consumer Notices</h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>MD Media LLC (PennyFloat) is not a lender and does not make credit decisions.</li>
              <li>We do not guarantee approval, rates, fees, or funding timelines.</li>
              <li>All loan terms, costs, and eligibility requirements are set by lenders or providers.</li>
              <li>You should verify all terms directly with the lender or provider before accepting an offer.</li>
            </ul>
          </Card>

          <Card className="p-6 border-slate-200 bg-white space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">Contact</h2>
            <p className="text-slate-700 leading-relaxed">
              If you have questions about this disclosure, contact Minh Ho at <span className="font-semibold">admin@pennyfloat.com</span>.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
