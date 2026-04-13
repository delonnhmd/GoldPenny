import OpenAI from "openai";
import pg from "pg";
const { Pool } = pg;

// ── Config ────────────────────────────────────────────────────────────────────
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Topics aligned with PennyFloat's 4 content pillars (per SEO strategy):
// 1. Credit & Lending  2. Personal Finance  3. Business Growth  4. Auto Refinancing
const TOPICS = [
  // Credit & Lending
  "mortgage rates 2026",
  "personal loan rates",
  "annual percentage rate loans",
  "federal reserve interest rates",
  "credit score impact loans",
  // Personal Finance Management
  "debt consolidation",
  "budgeting tips finance",
  "emergency funds personal finance",
  // Business Growth Funding
  "small business loans Houston",
  "crypto lending",
  // Auto Refinancing
  "auto loan refinance rates",
];

// Map topic → page value in your market_posts table
// ⚠️ Update these values to match what you use in your DB (run: SELECT DISTINCT page FROM market_posts;)
const TOPIC_PAGE_MAP = {
  "mortgage rates 2026": "news",
  "personal loan rates": "news",
  "annual percentage rate loans": "news",
  "federal reserve interest rates": "news",
  "credit score impact loans": "news",
  "debt consolidation": "news",
  "budgeting tips finance": "news",
  "emergency funds personal finance": "news",
  "small business loans Houston": "news",
  "crypto lending": "news",
  "auto loan refinance rates": "news",
};

// ── Clients ───────────────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
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

// ── Rewrite article with GPT-4o mini ─────────────────────────────────────────
async function rewriteWithOpenAI(article) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are an expert financial content writer for PennyFloat.com — an educational loan comparison platform operated by MD Media LLC, serving borrowers across Houston, TX and beyond. PennyFloat connects users with 200+ trusted lending partners offering personal loans, auto loans, mortgages, business loans, and crypto-backed lending.

Your job is to rewrite financial news articles into high-quality, SEO-optimized blog posts for the "Smart Penny" blog that build topical authority and rank on Google in 2026.

## BRAND VOICE
- Trustworthy, educational, and empowering — like a knowledgeable friend, not a salesperson
- Simple, clear language — avoid jargon, explain terms when used
- Always position PennyFloat as an unbiased educational resource, NOT a lender

## SEO WRITING RULES (E-E-A-T Compliant)
- Length: 300-400 words
- Use the primary keyword naturally in the first 50 words
- Include 2-3 secondary/long-tail keywords naturally throughout (e.g. "annual percentage rate", "soft credit inquiry", "debt consolidation Houston")
- Write in short paragraphs (2-3 sentences max) for mobile readability
- Include one factual statistic or data point from the original article
- Do NOT fabricate statistics or facts not in the original article
- Do NOT include the title in the content body

## CONTENT PILLARS — always tie the article to one of these:
1. Credit & Lending (mortgage rates, personal loans, APR, credit scores)
2. Personal Finance Management (budgeting, emergency funds, debt management)
3. Business Growth Funding (small business loans, startup financing)
4. Auto Refinancing (auto loan rates, refinancing tips)

## LOCAL SEO — when relevant, mention:
- Houston, TX borrowers or the Houston lending market
- Nearby areas: Katy, The Woodlands, Sugar Land
- Local context: Houston health professionals, small business owners, etc.

## TRUST SIGNALS TO WEAVE IN (when naturally relevant)
- "No impact to your credit score" / soft inquiry system
- "Next business day funding" / fast funding
- "Compare 200+ lending partners"
- No hidden fees or prepayment penalties
- 256-bit SSL security and data privacy

## CALL TO ACTION
Always end with ONE of these CTAs (vary them):
- "Compare current rates on PennyFloat — no impact to your credit score."
- "Check your rate in minutes at PennyFloat.com. Soft inquiry only."
- "See your loan options instantly at PennyFloat — fast funding, no hidden fees."
- "Explore 200+ lending partners at PennyFloat to find your best rate today."

## OUTPUT FORMAT
Always return a valid JSON object only — no extra text:
{
  "title": "SEO-optimized title (50-60 characters, include primary keyword)",
  "content": "Full article body (300-400 words, HTML paragraph tags like <p>...</p> for each paragraph)"
}`,
      },
      {
        role: "user",
        content: `Rewrite this article:\n\nTitle: ${article.title}\nDescription: ${article.description}\nContent: ${article.content}`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
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
        // Rewrite with GPT-4o mini
        const rewritten = await rewriteWithOpenAI(article);

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
