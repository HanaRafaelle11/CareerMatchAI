import { BaseJobConnector, type RawJob } from "./BaseJobConnector.ts";

export class RemoteOkConnector extends BaseJobConnector {
  readonly platformName = "RemoteOK";

  async searchJobs(keyword: string, location: string, pageNum: number): Promise<RawJob[]> {
    if (pageNum > 1) return [];

    const url = `https://remoteok.com/api?tag=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) return [];

    const data = await res.json();
    const rawJobs = Array.isArray(data) ? data.filter(item => typeof item === "object") : [];
    const results = rawJobs.slice(0, 15).map((j: any) => ({
      title: j.position || "",
      description: j.description || "",
      companyName: j.company || "RemoteOK Hirer",
      location: j.location || "Remoto",
      sourceUrl: j.url || "",
      sourcePlatform: this.platformName,
      publishedAt: j.date
    }));

    return results;
  }
}
