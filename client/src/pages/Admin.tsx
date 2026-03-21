import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateSmartPennyPost, useDeleteSmartPennyPost, useSmartPennyPosts, useUpdateSmartPennyPost } from "@/hooks/use-smart-penny-posts";
import { useAdminLeads, useAdminReport } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bold, Code2, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Pencil, Quote, Strikethrough, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TurndownService from "turndown";
import { setPageSeo } from "@/lib/seo";

type MediaItem = { id: number; filename: string; mimeType: string; sizeBytes: number; createdAt: string; url: string };

async function compressImageToBase64(
  file: File,
  maxWidth = 1200,
  quality = 0.85
): Promise<{ base64: string; mimeType: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas unavailable")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1];
            resolve({ base64, mimeType: "image/jpeg", filename: file.name.replace(/\.[^.]+$/, ".jpg") });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed")); };
    img.src = objectUrl;
  });
}

type AdminPage = "rates" | "smart-penny" | "shopping-guide";

function escapeCsv(value: string | number) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function Admin() {
  useEffect(() => {
    setPageSeo({
      title: "Admin | PennyFloat",
      description: "PennyFloat content administration portal.",
      canonical: "https://www.pennyfloat.com/admin",
      robots: "noindex, nofollow, noarchive",
    });
  }, []);

  const { toast } = useToast();
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("adminKey") || "");
  const [page, setPage] = useState<AdminPage>("rates");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [reportPeriod, setReportPeriod] = useState<"day" | "week">("day");
  const postContentRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputLeftRef = useRef<HTMLInputElement | null>(null);
  const fileInputRightRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const turndownService = useMemo(
    () =>
      new TurndownService({
        headingStyle: "atx",
        bulletListMarker: "-",
        codeBlockStyle: "fenced",
        emDelimiter: "*",
        strongDelimiter: "**",
      }),
    []
  );

  const isProtected = useMemo(() => adminKey.trim().length > 0, [adminKey]);
  const isUnlocked = isProtected;

  const postsQuery = useSmartPennyPosts(page);
  const createPostMutation = useCreateSmartPennyPost(adminKey);
  const updatePostMutation = useUpdateSmartPennyPost(adminKey);
  const deletePostMutation = useDeleteSmartPennyPost(adminKey);
  const leadsQuery = useAdminLeads(adminKey, 100, isUnlocked);
  const reportQuery = useAdminReport(adminKey, reportPeriod, isUnlocked);

  const isEditingPost = editingPostId !== null;

  const handleUnlock = () => {
    if (!adminKey.trim()) {
      toast({ title: "Admin key required", variant: "destructive" });
      return;
    }
    sessionStorage.setItem("adminKey", adminKey.trim());
    toast({ title: "Admin unlocked", description: "You can now publish updates." });
  };

  const resetPostEditor = () => {
    setPostTitle("");
    setPostContent("");
    setEditingPostId(null);
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
      if (editingPostId !== null) {
        await updatePostMutation.mutateAsync({
          id: editingPostId,
          page,
          title: postTitle.trim(),
          content: postContent.trim(),
        });

        toast({
          title: "Post updated",
          description: "Your changes are now live.",
        });
      } else {
        await createPostMutation.mutateAsync({
          page,
          title: postTitle.trim(),
          content: postContent.trim(),
        });

        toast({
          title: "Post published",
          description: `${page === "rates" ? "News" : page === "smart-penny" ? "Smart Penny" : "Shopping Guide"} post is now live.`,
        });
      }

      resetPostEditor();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save post";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    }
  };

  const handleStartEdit = (post: { id: number; title: string; content: string }) => {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostContent(post.content);
  };

  const handleDeletePost = async (post: { id: number; page: AdminPage }) => {
    const confirmed = window.confirm("Delete this post? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    try {
      await deletePostMutation.mutateAsync(post);

      if (editingPostId === post.id) {
        resetPostEditor();
      }

      toast({ title: "Post deleted" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete post";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  const wrapSelectedText = (prefix: string, suffix = prefix) => {
    const textarea = postContentRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = postContent.slice(0, start);
    const selected = postContent.slice(start, end) || "text";
    const after = postContent.slice(end);
    const nextValue = `${before}${prefix}${selected}${suffix}${after}`;

    setPostContent(nextValue);

    requestAnimationFrame(() => {
      const nextStart = start + prefix.length;
      const nextEnd = nextStart + selected.length;
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = postContentRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = postContent.slice(start, end) || "item";
    const transformed = selected
      .split("\n")
      .map((line) => `${prefix}${line || "item"}`)
      .join("\n");

    const before = postContent.slice(0, start);
    const after = postContent.slice(end);
    const nextValue = `${before}${transformed}${after}`;
    setPostContent(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + transformed.length);
    });
  };

  const insertLinkMarkdown = () => {
    const textarea = postContentRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = postContent.slice(start, end) || "link text";
    const url = window.prompt("Link URL", "https://");
    if (!url || !url.trim()) {
      return;
    }

    const markdown = `[${selected}](${url.trim()})`;
    const nextValue = `${postContent.slice(0, start)}${markdown}${postContent.slice(end)}`;
    setPostContent(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + markdown.length);
    });
  };

  const loadMediaLibrary = useCallback(async () => {
    if (!adminKey.trim()) return;
    setMediaLoading(true);
    try {
      const res = await fetch("/api/admin/media", { headers: { "x-admin-key": adminKey.trim() } });
      if (!res.ok) throw new Error("Failed to load media");
      const data: MediaItem[] = await res.json();
      setMediaLibrary(data);
    } catch {
      // silently ignore — user can retry
    } finally {
      setMediaLoading(false);
    }
  }, [adminKey]);

  const handleDeleteMedia = async (id: number) => {
    if (!window.confirm("Delete this image? Posts using it will show a broken image.")) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE", headers: { "x-admin-key": adminKey.trim() } });
      if (!res.ok) throw new Error("Delete failed");
      setMediaLibrary((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Image deleted" });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  const insertAtSelection = (text: string) => {
    const textarea = postContentRef.current;
    if (!textarea) {
      setPostContent((current) => `${current}${text}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = postContent.slice(0, start);
    const after = postContent.slice(end);
    const nextValue = `${before}${text}${after}`;
    setPostContent(nextValue);

    requestAnimationFrame(() => {
      const cursor = start + text.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const insertImageMarkdown = (url: string, alignment: "left" | "right", altText = "image") => {
    insertAtSelection(`![${altText}](${url} "${alignment}")`);
  };

  const handleUploadImage = async (file: File, alignment: "left" | "right") => {
    setUploadingImage(true);
    try {
      const compressed = await compressImageToBase64(file);
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey.trim() },
        body: JSON.stringify({ filename: compressed.filename, mimeType: compressed.mimeType, data: compressed.base64 }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const json: { id: number; url: string; filename: string; sizeBytes: number } = await res.json();
      const altText = window.prompt("Image alt text", file.name.replace(/\.[^.]+$/, "")) || "image";
      insertImageMarkdown(json.url, alignment, altText);
      toast({ title: "Image uploaded", description: `${json.filename} (${Math.round(json.sizeBytes / 1024)} KB)` });
      await loadMediaLibrary();
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePostContentPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = event.clipboardData.getData("text/html");
    if (!html) {
      return;
    }

    const markdown = turndownService
      .turndown(html)
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const fallbackText = event.clipboardData.getData("text/plain").trim();
    const nextText = markdown || fallbackText;
    if (!nextText) {
      return;
    }

    event.preventDefault();
    insertAtSelection(nextText);
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
    <div className="min-h-screen bg-[#f4fafc] font-sans">
      <Header />
      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">Content Admin</h1>
          <p className="text-slate-600">Publish blog-style news posts for News and Smart Penny pages. Changes are live immediately.</p>

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
                  <Button type="button" variant={page === "rates" ? "default" : "outline"} onClick={() => setPage("rates")}>News Page</Button>
                  <Button type="button" variant={page === "smart-penny" ? "default" : "outline"} onClick={() => setPage("smart-penny")}>Smart Penny Page</Button>
                  <Button type="button" variant={page === "shopping-guide" ? "default" : "outline"} onClick={() => setPage("shopping-guide")}>Shopping Guide Page</Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Post Title</label>
                  <Input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} className="h-11" placeholder="Enter headline" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Post Content</label>
                  <div className="rounded-md border border-slate-200 p-1 flex flex-wrap items-center gap-1 bg-slate-50">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => wrapSelectedText("**")} title="Bold">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => wrapSelectedText("*")} title="Italic">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => wrapSelectedText("~~")} title="Strikethrough">
                      <Strikethrough className="h-4 w-4" />
                    </Button>
                    <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => wrapSelectedText("## ", "")} title="Heading">
                      <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyLinePrefix("- ")} title="Bullet list">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyLinePrefix("1. ")} title="Numbered list">
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyLinePrefix("> ")} title="Quote">
                      <Quote className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => wrapSelectedText("`", "`")} title="Inline code">
                      <Code2 className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={insertLinkMarkdown} title="Insert link">
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden="true" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileInputLeftRef.current?.click()} disabled={uploadingImage} title="Upload & insert image (left)">
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileInputRightRef.current?.click()} disabled={uploadingImage} title="Upload & insert image (right)">
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4 -scale-x-100" />}
                    </Button>
                    <input ref={fileInputLeftRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, "left"); e.target.value = ""; }} />
                    <input ref={fileInputRightRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadImage(f, "right"); e.target.value = ""; }} />
                  </div>
                  <Textarea
                    ref={postContentRef}
                    value={postContent}
                    onChange={(event) => setPostContent(event.target.value)}
                    onPaste={handlePostContentPaste}
                    rows={8}
                    placeholder="Write your Smart Penny or news update..."
                  />
                  <p className="text-xs text-slate-500">Markdown toolbar plus rich paste support: content from Google Docs, Word, and web pages is pasted with formatting preserved.</p>

                  <div className="rounded-md border border-slate-200 bg-white p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700">Live Preview</h3>
                    {postContent.trim().length === 0 ? (
                      <p className="text-sm text-slate-500">Start typing to preview formatted content.</p>
                    ) : (
                      <div className="prose prose-slate max-w-none prose-p:leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            img: ({ node: _node, ...props }) => {
                              const align = (props.title ?? "").toLowerCase().trim();
                              const floatClass = align === "left"
                                ? "md:float-left md:mr-4"
                                : "md:float-right md:ml-4";

                              return (
                                <img
                                  {...props}
                                  className={`not-prose ${floatClass} md:mb-3 md:mt-1 rounded-md max-w-full h-auto md:w-[220px]`}
                                  loading="lazy"
                                />
                              );
                            },
                          }}
                        >
                          {postContent}
                        </ReactMarkdown>
                        <div className="clear-both" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {isEditingPost ? (
                    <Button type="button" variant="outline" onClick={resetPostEditor}>
                      Cancel Edit
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={handlePublishPost}
                    disabled={createPostMutation.isPending || updatePostMutation.isPending}
                  >
                    {createPostMutation.isPending || updatePostMutation.isPending
                      ? "Saving..."
                      : isEditingPost
                        ? "Save Changes"
                        : "Publish Post"}
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
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900">{post.title}</p>
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => handleStartEdit(post)}>
                                <Pencil className="h-4 w-4" /> Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-red-700 border-red-200 hover:bg-red-50"
                                onClick={() => handleDeletePost({ id: post.id, page: post.page })}
                                disabled={deletePostMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{new Date(post.createdAt).toLocaleString()}</p>
                          <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">{post.content}</p>
                          {editingPostId === post.id ? (
                            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                              <Pencil className="h-3 w-3" /> Editing this post
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 border-slate-200 bg-white space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900">Media Library</h2>
                  <Button type="button" variant="outline" size="sm" onClick={loadMediaLibrary} disabled={mediaLoading}>
                    {mediaLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Refresh
                  </Button>
                </div>
                <p className="text-sm text-slate-500">Upload images using the image buttons in the post editor above. Click any image here to insert it into your post at your cursor position.</p>
                {mediaLibrary.length === 0 && !mediaLoading ? (
                  <p className="text-sm text-slate-400">No images uploaded yet. Use the toolbar above to upload your first image.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {mediaLibrary.map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                        <img src={item.url} alt={item.filename} className="w-full h-32 object-cover" loading="lazy" />
                        <div className="p-2 space-y-1">
                          <p className="text-xs text-slate-600 truncate" title={item.filename}>{item.filename}</p>
                          <p className="text-xs text-slate-400">{Math.round(item.sizeBytes / 1024)} KB</p>
                          <div className="flex gap-1">
                            <Button type="button" variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => { const alt = window.prompt("Alt text", item.filename.replace(/\.jpg$/, "")) || "image"; insertImageMarkdown(item.url, "left", alt); }}>
                              ← Insert
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => { const alt = window.prompt("Alt text", item.filename.replace(/\.jpg$/, "")) || "image"; insertImageMarkdown(item.url, "right", alt); }}>
                              Insert →
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeleteMedia(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
