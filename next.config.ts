import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Serve complete synchronous HTML (metadata resolved inside <head>) to
  // SEO crawlers that do not execute JavaScript.
  //
  // Next.js default htmlLimitedBots covers Bingbot, DuckDuckBot, Yandex,
  // social-preview bots, etc., but does NOT include Screaming Frog or most
  // third-party SEO audit tools. When a UA matches this regex, Next.js skips
  // React streaming and waits for generateMetadata to resolve before flushing
  // the response — guaranteeing <title>, <meta description>, and
  // <link rel="canonical"> are physically inside <head> in the raw HTML bytes.
  //
  // This list = Next.js built-in defaults + Screaming Frog + common SEO tools.
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|Screaming.?Frog|ScreamingFrog|AhrefsBot|SemrushBot|MJ12bot|DotBot|rogerbot|SiteAuditBot|DataForSeoBot|PetalBot|Bytespider|archive\.org_bot|ia_archiver/i,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

