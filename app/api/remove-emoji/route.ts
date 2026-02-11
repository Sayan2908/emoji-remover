import { NextRequest, NextResponse } from "next/server";

// Comprehensive emoji regex covering all Unicode emoji ranges
const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{3030}\u{303D}\u{3297}\u{3299}\u{200C}-\u{200D}\u{2028}\u{2029}\u{FE0E}-\u{FE0F}\u{E0001}-\u{E007F}]/gu;

function removeEmojis(text: string): string {
  return text.replace(EMOJI_REGEX, "");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

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
    const cleanedText = removeEmojis(text);

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
