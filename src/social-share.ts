/**
 * Social sharing module for game results (Issue #46).
 */

export const HASHTAG = "#落ち物パズルゲーム・蘇";

export function buildShareText(score: number, url: string): string {
  return `スコアは ${score.toFixed(2)} でした。 ${url} ${HASHTAG}`;
}

export function dataUrlToFile(dataUrl: string | null, filename: string): File | null {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  try {
    const parts = dataUrl.split(",");
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch {
    return null;
  }
}

export interface ShareOptions {
  score: number;
  url: string;
  imageDataUrl?: string | null;
}

export function renderShareButtons(
  container: HTMLElement,
  options: ShareOptions,
): void {
  container.innerHTML = "";
  const shareText = buildShareText(options.score, options.url);
  const imageFile = dataUrlToFile(options.imageDataUrl ?? null, "final-board.png");

  // 1. X (Twitter)
  const xBtn = document.createElement("a");
  xBtn.className = "share-button share-x";
  xBtn.textContent = "X";
  xBtn.href = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  xBtn.target = "_blank";
  xBtn.rel = "noopener";
  container.appendChild(xBtn);

  // 2. LINE
  const lineBtn = document.createElement("a");
  lineBtn.className = "share-button share-line";
  lineBtn.textContent = "LINE";
  lineBtn.href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
    `${options.url}?text=${encodeURIComponent(shareText)}`,
  )}`;
  lineBtn.target = "_blank";
  lineBtn.rel = "noopener";
  container.appendChild(lineBtn);

  // 3. Instagram
  const instaBtn = document.createElement("button");
  instaBtn.type = "button";
  instaBtn.className = "share-button share-instagram";
  instaBtn.textContent = "Instagram";
  instaBtn.addEventListener("click", async () => {
    // If Web Share API supports file sharing, use it to share image to Instagram
    if (
      imageFile &&
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [imageFile] })
    ) {
      try {
        await navigator.share({
          files: [imageFile],
          text: shareText,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    // Fallback: download the final board image or open Instagram
    if (options.imageDataUrl) {
      const a = document.createElement("a");
      a.href = options.imageDataUrl;
      a.download = "final-board.png";
      a.click();
    }
    globalThis.open("https://www.instagram.com/", "_blank", "noopener");
  });
  container.appendChild(instaBtn);

  // 4. 端末標準の共有メニュー (🔗)
  const nativeBtn = document.createElement("button");
  nativeBtn.type = "button";
  nativeBtn.className = "share-button share-native";
  nativeBtn.textContent = "🔗";
  nativeBtn.title = "共有";
  nativeBtn.setAttribute("aria-label", "共有メニュー");
  nativeBtn.addEventListener("click", async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      const shareData: ShareData = {
        title: "落ち物パズルゲーム・蘇",
        text: shareText,
        url: options.url,
      };
      if (
        imageFile &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [imageFile] })
      ) {
        shareData.files = [imageFile];
      }
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    // Fallback: copy text to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        const originalText = nativeBtn.textContent;
        nativeBtn.textContent = "コピー完了!";
        setTimeout(() => {
          nativeBtn.textContent = originalText;
        }, 2000);
      }
    } catch {
      // no-op
    }
  });
  container.appendChild(nativeBtn);
}
