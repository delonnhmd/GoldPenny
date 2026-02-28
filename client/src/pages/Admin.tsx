import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateMarketPost, useMarketPosts } from "@/hooks/use-market-posts";
import { useAdminLeads, useAdminReport } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MarketPage = "rates" | "market";

function escapeCsv(value: string | number) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function Admin() {
  const { toast } = useToast();
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("adminKey") || "");
  const [page, setPage] = useState<MarketPage>("rates");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [reportPeriod, setReportPeriod] = useState<"day" | "week">("day");

  const isProtected = useMemo(() => adminKey.trim().length > 0, [adminKey]);
  const isUnlocked = isProtected;

  const postsQuery = useMarketPosts(page);
  const createPostMutation = useCreateMarketPost(adminKey);
  const leadsQuery = useAdminLeads(adminKey, 100, isUnlocked);
  const reportQuery = useAdminReport(adminKey, reportPeriod, isUnlocked);

  const handleUnlock = () => {
    if (!adminKey.trim()) {
      toast({ title: "Admin key required", variant: "destructive" });
      return;
    }
    sessionStorage.setItem("adminKey", adminKey.trim());
    toast({ title: "Admin unlocked", description: "You can now publish updates." });
  };

  const handlePublishPost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      toast({
        title: "Title and content required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        page,
        title: postTitle.trim(),
        content: postContent.trim(),
      });

      setPostTitle("");
      setPostContent("");

      toast({
        title: "Post published",
        description: `${page === "rates" ? "Rates" : "Market"} post is now live.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish post";
      toast({ title: "Publish failed", description: message, variant: "destructive" });
    }
  };

  const handleExportCsv = () => {
    const leads = leadsQuery.data ?? [];
    if (!leads.length) {
      toast({ title: "No leads to export", variant: "destructive" });
      return;
    }

    const headers = [
      "id",
      "fullName",
      "email",
      "phone",
      "loanPurpose",
      "loanAmount",
      "creditScoreRange",
      "employmentStatus",
      "zipCode",
      "createdAt",
    ];

    const rows = leads.map((lead) => [
      lead.id,
      lead.fullName,
      lead.email,
      lead.phone,
      lead.loanPurpose,
      lead.loanAmount,
      lead.creditScoreRange,
      lead.employmentStatus,
      lead.zipCode,
      new Date(lead.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pennyfloat-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Content Admin</h1>
          <p className="text-slate-600">Publish blog-style news posts for Rates and Market pages. Changes are live immediately.</p>

          <Card className="p-6 border-slate-200 bg-white space-y-4">
            <label className="text-sm font-semibold text-slate-700">Admin Key</label>
            <div className="flex gap-3">
              <Input
                type="password"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
                placeholder="Enter admin key"
                className="h-11"
              />
              <Button type="button" onClick={handleUnlock}>Unlock</Button>
            </div>
          </Card>

          {isProtected && (
            <>
              <Card className="p-6 border-slate-200 bg-white space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={page === "rates" ? "default" : "outline"} onClick={() => setPage("rates")}>Rates Page</Button>
                  <Button type="button" variant={page === "market" ? "default" : "outline"} onClick={() => setPage("market")}>Market Page</Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Post Title</label>
                  <Input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} className="h-11" placeholder="Enter headline" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Post Content</label>
                  <Textarea value={postContent} onChange={(event) => setPostContent(event.target.value)} rows={8} placeholder="Write your market or rates update..." />
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={handlePublishPost} disabled={createPostMutation.isPending}>
                    {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
                  </Button>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Published Posts</h3>
                  {postsQuery.isLoading ? (
                    <p className="text-slate-500">Loading posts…</p>
                  ) : postsQuery.error ? (
                    <p className="text-red-600 text-sm">{postsQuery.error.message}</p>
                  ) : (postsQuery.data ?? []).length === 0 ? (
                    <p className="text-slate-500">No posts published yet for this page.</p>
                  ) : (
                    <div className="space-y-3">
                      {(postsQuery.data ?? []).map((post) => (
                        <div key={post.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                          <p className="font-semibold text-slate-900">{post.title}</p>
                          <p className="text-xs text-slate-500 mb-2">{new Date(post.createdAt).toLocaleString()}</p>
                          <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">{post.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 border-slate-200 bg-white space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900">Leads Report</h2>
                  <div className="flex gap-2">
                    <Button type="button" variant={reportPeriod === "day" ? "default" : "outline"} onClick={() => setReportPeriod("day")}>Today</Button>
                    <Button type="button" variant={reportPeriod === "week" ? "default" : "outline"} onClick={() => setReportPeriod("week")}>This Week</Button>
                  </div>
                </div>

                {reportQuery.isLoading ? (
                  <p className="text-slate-500">Loading report…</p>
                ) : reportQuery.error ? (
                  <p className="text-red-600 text-sm">{reportQuery.error.message}</p>
                ) : reportQuery.data ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <p className="text-sm text-slate-600">Total Leads</p>
                      <p className="text-2xl font-bold text-slate-900">{reportQuery.data.totalLeads}</p>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <p className="text-sm text-slate-600">Avg Loan Amount</p>
                      <p className="text-2xl font-bold text-slate-900">${reportQuery.data.avgLoanAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                      <p className="text-sm text-slate-600">Top Purpose</p>
                      <p className="text-lg font-bold text-slate-900">{reportQuery.data.topPurposes[0]?.purpose ?? "—"}</p>
                    </div>
                  </div>
                ) : null}

                {reportQuery.data && reportQuery.data.topPurposes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Purpose Breakdown</h3>
                    <ul className="list-disc pl-6 text-slate-700 space-y-1">
                      {reportQuery.data.topPurposes.map((item) => (
                        <li key={item.purpose}>{item.purpose}: {item.count}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              <Card className="p-6 border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900">Recent Leads</h2>
                  <Button type="button" variant="outline" onClick={handleExportCsv} disabled={!leadsQuery.data?.length}>
                    Export CSV
                  </Button>
                </div>
                {leadsQuery.isLoading ? (
                  <p className="text-slate-500">Loading leads…</p>
                ) : leadsQuery.error ? (
                  <p className="text-red-600 text-sm">{leadsQuery.error.message}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(leadsQuery.data ?? []).map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.fullName}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.phone}</TableCell>
                          <TableCell>{lead.loanPurpose}</TableCell>
                          <TableCell>${lead.loanAmount.toLocaleString()}</TableCell>
                          <TableCell>{new Date(lead.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
