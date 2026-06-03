import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getCronSecret(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return request.headers.get("x-cron-secret") || url.searchParams.get("secret");
}

function isPositiveInteger(value: string | null, fallback: string) {
  if (!value) return fallback;
  return /^\d+$/.test(value) && Number(value) > 0 ? value : fallback;
}

async function runAutomation(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;

  if (!configuredSecret) {
    return Response.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  }

  if (getCronSecret(request) !== configuredSecret) {
    return Response.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = isPositiveInteger(url.searchParams.get("limit"), "3");
  const articles = isPositiveInteger(url.searchParams.get("articles"), "3");
  const dryRun = url.searchParams.get("dryRun") === "true";
  const startedAt = new Date();
  const scriptPath = path.join(process.cwd(), "scripts", "run-influencer-automation.mjs");
  const args = [scriptPath, "--limit", limit, "--articles", articles];

  if (dryRun) {
    args.push("--dry-run", "true");
  }

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, args, {
      cwd: process.cwd(),
      env: process.env,
      maxBuffer: 1024 * 1024 * 3,
      timeout: 1000 * 60 * 12,
      windowsHide: true,
    });

    return Response.json({
      ok: true,
      dryRun,
      limit: Number(limit),
      articles: Number(articles),
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  } catch (error) {
    const commandError = error as Error & { stdout?: string; stderr?: string };

    return Response.json(
      {
        ok: false,
        dryRun,
        limit: Number(limit),
        articles: Number(articles),
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        error: commandError.message,
        stdout: commandError.stdout?.trim() || "",
        stderr: commandError.stderr?.trim() || "",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return runAutomation(request);
}

export async function POST(request: Request) {
  return runAutomation(request);
}
