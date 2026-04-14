import type { SyntheticEvent } from "react";

const svgPlaceholder = (title: string) => {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8efe2" />
          <stop offset="100%" stop-color="#e8dccb" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bg)" />
      <text x="50%" y="46%" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="72" fill="#8b2715" font-weight="700">
        Signal Shop
      </text>
      <text x="50%" y="58%" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" fill="#1f1f24">
        ${safeTitle}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const handleProductImageError = (
  event: SyntheticEvent<HTMLImageElement>,
  title: string
) => {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = svgPlaceholder(title);
};
