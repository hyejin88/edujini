import type { MetadataRoute } from "next";
import seedData from "@/lib/seed.json";
import unitsData from "@/lib/units.json";
import { LEARN_UNITS } from "@/lib/learn-units";

const BASE = "https://edujini.pages.dev";

interface Unit {
  id: string;
  subject: string;
  grade: number;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const units = unitsData as Unit[];

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/library?grade=3&subject=수학`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // 단원 페이지 — 실제 문항이 있는 단원만
  const problemSet = new Set<string>(
    (seedData as Array<{ unit_id: string }>).map((p) => p.unit_id)
  );
  const unitPages: MetadataRoute.Sitemap = units
    .filter((u) => problemSet.has(u.id))
    .flatMap((u) => [
      {
        url: `${BASE}/library/${encodeURIComponent(u.id)}?sheet=comp`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${BASE}/library/${encodeURIComponent(u.id)}?mode=drill`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      },
    ]);

  // SEO 단원별 랜딩 페이지
  const learnPages: MetadataRoute.Sitemap = LEARN_UNITS.map((u) => ({
    url: `${BASE}/learn/grade-${u.grade}/${u.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  // 학년 인덱스 페이지 (1~6학년)
  const gradeIndexPages: MetadataRoute.Sitemap = [1, 2, 3, 4, 5, 6].map((g) => ({
    url: `${BASE}/learn/grade-${g}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...unitPages, ...learnPages, ...gradeIndexPages];
}
