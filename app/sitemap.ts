import type { MetadataRoute } from "next";

const BASE_URL = "https://sql.sugirep.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date("2026-03-08"),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/changelog`,
      lastModified: new Date("2026-03-08"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
