import { NextRequest, NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────────────────
interface DiffLine {
    type: "equal" | "added" | "removed";
    lineNumber: number;     // 1-based, refers to position in respective file
    content: string;        // original (non-normalized) content
}

interface DiffResult {
    left: DiffLine[];
    right: DiffLine[];
    similarity: number;     // 0-100
    totalCharsLeft: number;
    totalCharsRight: number;
    linesAdded: number;
    linesRemoved: number;
    linesUnchanged: number;
}

// ── Whitespace normalisation (Codeforces-level) ──────────────────────
function normalize(line: string): string {
    return line
        .replace(/\t/g, " ")       // tabs → space
        .replace(/ {2,}/g, " ")    // collapse multiple spaces
        .trim();                   // trim leading/trailing
}

// ── LCS-based line diff ──────────────────────────────────────────────
function lcs(a: string[], b: string[]): number[][] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
        new Array(n + 1).fill(0)
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp;
}

function computeDiff(textA: string, textB: string): DiffResult {
    const rawLinesA = textA.split("\n");
    const rawLinesB = textB.split("\n");

    // Normalised versions for matching
    const normA = rawLinesA.map(normalize);
    const normB = rawLinesB.map(normalize);

    // Filter out blank lines for matching (but keep originals for display)
    // We'll diff on all lines but compare normalised
    const dp = lcs(normA, normB);

    // Backtrack to get the diff
    const leftResult: DiffLine[] = [];
    const rightResult: DiffLine[] = [];
    let i = normA.length;
    let j = normB.length;
    const pairs: Array<{ type: "equal" | "removed" | "added"; i?: number; j?: number }> = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && normA[i - 1] === normB[j - 1]) {
            pairs.push({ type: "equal", i: i - 1, j: j - 1 });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            pairs.push({ type: "added", j: j - 1 });
            j--;
        } else if (i > 0) {
            pairs.push({ type: "removed", i: i - 1 });
            i--;
        }
    }
    pairs.reverse();

    let linesAdded = 0;
    let linesRemoved = 0;
    let linesUnchanged = 0;
    let matchedChars = 0;

    for (const p of pairs) {
        if (p.type === "equal") {
            const lineA = rawLinesA[p.i!];
            const lineB = rawLinesB[p.j!];
            leftResult.push({ type: "equal", lineNumber: p.i! + 1, content: lineA });
            rightResult.push({ type: "equal", lineNumber: p.j! + 1, content: lineB });
            linesUnchanged++;
            matchedChars += normA[p.i!].length;
        } else if (p.type === "removed") {
            leftResult.push({ type: "removed", lineNumber: p.i! + 1, content: rawLinesA[p.i!] });
            linesRemoved++;
        } else {
            rightResult.push({ type: "added", lineNumber: p.j! + 1, content: rawLinesB[p.j!] });
            linesAdded++;
        }
    }

    const totalNormCharsA = normA.reduce((s, l) => s + l.length, 0);
    const totalNormCharsB = normB.reduce((s, l) => s + l.length, 0);
    const maxChars = Math.max(totalNormCharsA, totalNormCharsB, 1);
    const similarity = Math.round((matchedChars / maxChars) * 10000) / 100;

    return {
        left: leftResult,
        right: rightResult,
        similarity: Math.min(similarity, 100),
        totalCharsLeft: textA.length,
        totalCharsRight: textB.length,
        linesAdded,
        linesRemoved,
        linesUnchanged,
    };
}

// ── Route handler ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { textA, textB } = body as { textA: string; textB: string };

        if (!textA && !textB) {
            return NextResponse.json({ error: "Both inputs are empty." }, { status: 400 });
        }

        const result = computeDiff(textA || "", textB || "");
        return NextResponse.json(result);
    } catch {
        return NextResponse.json(
            { error: "Failed to compute diff." },
            { status: 500 }
        );
    }
}
