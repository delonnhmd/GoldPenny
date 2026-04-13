const Anthropic = require("@anthropic-ai/sdk");
const { Pool } = require("pg");

// ── Config ────────────────────────────────────────────────────────────────────
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Topics relevant to PennyFloat (loan comparison / financial education site)
const TOPICS = [
  "mortgage rates",
  "personal loan rates",
  "auto loan rates",
  "federal reserve interest rates",
  "crypto lending",
  "debt consolidation",
];

// Map topic → page value in your market_posts table
// ⚠️ Update these values to match what you use in your DB (run: SELECT DISTINCT page FROM market_posts;)
const TOPIC_PAGE_MAP = {
  "mortgage rates": "news",
  "personal loan rates": "news",
  "auto loan rates": "news",
  "federal reserve interest rates": "news",
  "crypto lending": "news",
  "debt consolidation": "news",
};

// ── Clients ───────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ── Fetch news from NewsAPI ───────────────────────────────────────────────────
async function fetchNews(topic) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${NEWS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "ok") {
    console.error(`NewsAPI error for "${topic}":`, data.message);
    return [];
  }
  return data.articles.filter((a) => a.title && a.description && a.content);
}

// ── Rewrite article with Claude ───────────────────────────────────────────────
async function rewriteWithClaude(article, topic) {
  const prompt = `You are a financial content writer for PennyFloat.com, a loan comparison and financial education platform.

Rewrite the following news article in an informative, friendly, and educational tone suited for people looking for loans or financial guidance.

Guidelines:
- Keep it between 250-400 words
- Use simple, clear language (avoid jargon)
- Naturally mention how this news affects borrowers when relevant
- End with a subtle CTA like: "Compare current rates on PennyFloat to find your best option."
- Do NOT include the title in the content body
- Do NOT make up statistics or facts not in the original article

Original Article:
Title: ${article.title}
Description: ${article.description}
Content: ${article.content}

Return ONLY a JSON object with this exact format:
{
  "title": "your rewritten SEO-friendly title here",
  "content": "your rewritten article content here"
}`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].text.trim();

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude did not return valid JSON");

  return JSON.parse(jsonMatch[0]);
}

// ── Check if article already exists ──────────────────────────────────────────
async function articleExists(title) {
  const result = await pool.query(
    "SELECT id FROM market_posts WHERE title = $1 LIMIT 1",
    [title]
  );
  return result.rows.length > 0;
}

// ── Save article to PostgreSQL ────────────────────────────────────────────────
async function saveArticle(page, title, content) {
  const now = new Date();
  await pool.query(
    `INSERT INTO market_posts (page, title, content, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $4)`,
    [page, title, content, now]
  );
  console.log(`✅ Saved: "${title}"`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🤖 PennyFloat News Bot starting...");
  let totalSaved = 0;

  for (const topic of TOPICS) {
    console.log(`\n📰 Fetching news for: "${topic}"`);

    let articles;
    try {
      articles = await fetchNews(topic);
    } catch (err) {
      console.error(`Failed to fetch news for "${topic}":`, err.message);
      continue;
    }

    console.log(`   Found ${articles.length} articles`);

    for (const article of articles) {
      try {
        // Rewrite with Claude
        const rewritten = await rewriteWithClaude(article, topic);

        // Skip if title already exists in DB
        const exists = await articleExists(rewritten.title);
        if (exists) {
          console.log(`   ⏭️  Skipping (duplicate): "${rewritten.title}"`);
          continue;
        }

        const page = TOPIC_PAGE_MAP[topic] || "news";
        await saveArticle(page, rewritten.title, rewritten.content);
        totalSaved++;

        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        console.error(`   ❌ Failed to process article:`, err.message);
      }
    }
  }

  await pool.end();
  console.log(`\n🎉 Done! Saved ${totalSaved} new articles.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
