import { NextRequest, NextResponse } from "next/server";

// ── Simple mode ──────────────────────────────────────────────────────
// Targets standard pictographic emoji only (faces, animals, flags, etc.)
const SIMPLE_EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]|\u{200D}/gu;

// ── Thorough mode ────────────────────────────────────────────────────
// Strips EVERYTHING that isn't basic printable ASCII / standard UTF-8 text.
// Catches arrows (→ ← ↑ ↓), bullets (•), info symbols (ℹ), colored
// circles/squares, box-drawing, math symbols, dingbats, misc. symbols, etc.
const THOROUGH_EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2150}-\u{218F}\u{2900}-\u{297F}\u{2980}-\u{29FF}\u{2A00}-\u{2AFF}\u{3000}-\u{303F}\u{3200}-\u{32FF}\u{3300}-\u{33FF}\u{FE00}-\u{FE0F}\u{FE10}-\u{FE1F}\u{FE30}-\u{FE4F}\u{200B}-\u{200D}\u{2028}-\u{202F}\u{2060}-\u{206F}\u{20E3}\u{E0001}-\u{E007F}\u{E0020}-\u{E007F}\u{00A9}\u{00AE}\u{2022}\u{2026}\u{2030}\u{2031}\u{203C}\u{2049}\u{20E3}\u{2122}\u{2139}\u{25A0}-\u{25FF}\u{2580}-\u{259F}\u{2460}-\u{24FF}\u{2500}-\u{257F}\u{2660}-\u{2667}\u{2669}-\u{266F}\u{2670}-\u{2671}\u{231A}\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}\u{26AB}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;

function removeEmojis(text: string, mode: "simple" | "thorough"): string {
  const regex = mode === "thorough" ? THOROUGH_EMOJI_REGEX : SIMPLE_EMOJI_REGEX;
  return text.replace(regex, "");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) === "thorough" ? "thorough" : "simple";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB." },
        { status: 413 }
      );
    }

    const text = await file.text();
    const cleanedText = removeEmojis(text, mode);

    return NextResponse.json({
      originalText: text,
      cleanedText: cleanedText,
      fileName: file.name,
      originalSize: text.length,
      cleanedSize: cleanedText.length,
      emojisRemoved: text.length - cleanedText.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process the file." },
      { status: 500 }
    );
  }
}
