const translationCache = new Map<string, string>();

interface TranslateOptions {
  sourceLanguage?: string;
  targetLanguage: string;
}

function buildCacheKey(text: string, sourceLanguage: string, targetLanguage: string) {
  return `${sourceLanguage}:${targetLanguage}:${text}`;
}

function splitTextForTranslation(text: string, maxChunkLength = 3200) {
  if (text.length <= maxChunkLength) {
    return [text];
  }

  const paragraphs = text.split(/(\n\n+)/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const part of paragraphs) {
    if (!part) {
      continue;
    }

    if ((currentChunk + part).length <= maxChunkLength) {
      currentChunk += part;
      continue;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
      currentChunk = "";
    }

    if (part.length <= maxChunkLength) {
      currentChunk = part;
      continue;
    }

    for (let index = 0; index < part.length; index += maxChunkLength) {
      chunks.push(part.slice(index, index + maxChunkLength));
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

async function translateChunk(chunk: string, sourceLanguage: string, targetLanguage: string) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", sourceLanguage);
  url.searchParams.set("tl", targetLanguage);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", chunk);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Failed to translate content");
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return chunk;
  }

  const translated = (payload[0] as unknown[])
    .map((item) => (Array.isArray(item) ? String(item[0] ?? "") : ""))
    .join("");

  return translated || chunk;
}

export async function translateText(text: string, options: TranslateOptions) {
  const sourceLanguage = options.sourceLanguage ?? "en";
  const { targetLanguage } = options;

  if (!text.trim() || sourceLanguage === targetLanguage) {
    return text;
  }

  const cacheKey = buildCacheKey(text, sourceLanguage, targetLanguage);
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const chunks = splitTextForTranslation(text);
    const translatedChunks = await Promise.all(
      chunks.map((chunk) => translateChunk(chunk, sourceLanguage, targetLanguage)),
    );

    const translatedText = translatedChunks.join("");
    translationCache.set(cacheKey, translatedText);
    return translatedText;
  } catch {
    return text;
  }
}

export async function translateBatch(texts: string[], options: TranslateOptions) {
  const uniqueTexts = Array.from(new Set(texts));
  const translatedEntries = await Promise.all(
    uniqueTexts.map(async (text) => [text, await translateText(text, options)] as const),
  );

  const translatedMap = new Map(translatedEntries);
  return texts.map((text) => translatedMap.get(text) ?? text);
}
