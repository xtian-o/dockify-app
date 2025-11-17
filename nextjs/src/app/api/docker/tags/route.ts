import { Redis } from "ioredis";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

interface DockerTag {
  name: string;
  last_updated: string;
  digest: string;
  images: Array<{
    architecture: string;
    os: string;
    size: number;
  }>;
}

interface DockerHubResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DockerTag[];
}

interface ProcessedTag {
  name: string;
  lastUpdated: string;
  digest: string;
  size: number;
  majorVersion: number;
}

/**
 * Filters Docker tags to only include semantic version tags
 * Matches patterns like: 17, 17.2, 17.2.1
 */
function isSemanticVersion(tag: string): boolean {
  // Remove common suffixes to extract version
  const cleaned = tag
    .replace(/-alpine.*$/i, "")
    .replace(/-slim.*$/i, "")
    .replace(/-bookworm.*$/i, "")
    .replace(/-bullseye.*$/i, "");

  // Match semantic versions: 17, 17.2, 17.2.1
  const semverPattern = /^\d+(\.\d+)*$/;
  return semverPattern.test(cleaned);
}

/**
 * Extract major version from tag (e.g., "17.2.1" -> 17)
 */
function getMajorVersion(tag: string): number {
  const match = tag.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Get latest version for each major version
 */
function getLatestPerMajor(tags: ProcessedTag[]): ProcessedTag[] {
  const majorVersions = new Map<number, ProcessedTag>();

  for (const tag of tags) {
    const major = tag.majorVersion;
    const existing = majorVersions.get(major);

    if (!existing) {
      majorVersions.set(major, tag);
    } else {
      // Compare full version strings to get the latest
      const existingParts = existing.name.split(".").map(Number);
      const tagParts = tag.name.split(".").map(Number);

      let isNewer = false;
      for (
        let i = 0;
        i < Math.max(existingParts.length, tagParts.length);
        i++
      ) {
        const existingNum = existingParts[i] || 0;
        const tagNum = tagParts[i] || 0;

        if (tagNum > existingNum) {
          isNewer = true;
          break;
        } else if (tagNum < existingNum) {
          break;
        }
      }

      if (isNewer) {
        majorVersions.set(major, tag);
      }
    }
  }

  // Convert to array and sort by major version descending
  return Array.from(majorVersions.values()).sort(
    (a, b) => b.majorVersion - a.majorVersion,
  );
}

/**
 * API Route to fetch Docker Hub tags for a specific image
 * GET /api/docker/tags?image=postgres
 * Returns only the latest version for each major version (17, 16, 15, etc)
 * Cached in Redis for 24 hours
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const image = searchParams.get("image");

    if (!image) {
      return NextResponse.json(
        { error: "Image name is required" },
        { status: 400 },
      );
    }

    // Try to get from Redis cache
    const cacheKey = `docker:tags:${image}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log(`Cache hit for ${image}`);
      return NextResponse.json(JSON.parse(cached));
    }

    console.log(`Cache miss for ${image}, fetching from Docker Hub...`);

    // Fetch from Docker Hub API (get more tags to ensure we have all majors)
    const response = await fetch(
      `https://hub.docker.com/v2/repositories/library/${image}/tags?page_size=100`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Docker Hub API error: ${response.statusText}`);
    }

    const data: DockerHubResponse = await response.json();

    // Filter tags to only include semantic versions and process them
    const semanticTags: ProcessedTag[] = data.results
      .filter((tag) => isSemanticVersion(tag.name))
      .map((tag) => ({
        name: tag.name,
        lastUpdated: tag.last_updated,
        digest: tag.digest,
        size:
          tag.images.reduce((total, img) => total + img.size, 0) /
          (1024 * 1024), // Convert to MB
        majorVersion: getMajorVersion(tag.name),
      }));

    // Get only the latest version for each major
    const latestPerMajor = getLatestPerMajor(semanticTags);

    const result = {
      image,
      count: latestPerMajor.length,
      tags: latestPerMajor.map(({ majorVersion, ...rest }) => rest),
      cachedAt: new Date().toISOString(),
    };

    // Cache in Redis for 24 hours (86400 seconds)
    await redis.setex(cacheKey, 86400, JSON.stringify(result));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Docker tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch Docker tags" },
      { status: 500 },
    );
  }
}
