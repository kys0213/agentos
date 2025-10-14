#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const outputDir = path.join(repoRoot, 'exports', 'doc-bundles');

const bundles = [
  {
    name: 'start-here',
    title: 'AgentOS Docs — Start Here Bundle',
    sources: ['docs/00-start-here'],
  },
  {
    name: 'architecture',
    title: 'AgentOS Docs — Architecture Bundle',
    sources: ['docs/10-architecture'],
  },
  {
    name: 'specs',
    title: 'AgentOS Docs — Specs Bundle',
    sources: ['docs/20-specs'],
  },
  {
    name: 'developer-guides',
    title: 'AgentOS Docs — Developer Guides Bundle',
    sources: ['docs/30-developer-guides'],
  },
  {
    name: 'process-policy',
    title: 'AgentOS Docs — Process & Policy Bundle',
    sources: ['docs/40-process-policy'],
  },
];

const IGNORE_NAMES = new Set(['.DS_Store']);
const defaultBaseUrl = (process.env.DOCS_BUNDLE_BASE_URL ?? 'https://github.com/kys0213/agentos/blob/main/').replace(/\/?$/, '/');

const isRelativeLink = (link) => {
  if (!link) {
    return false;
  }

  const lower = link.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return false;
  }

  if (lower.startsWith('#') || lower.startsWith('mailto:') || lower.startsWith('data:')) {
    return false;
  }

  return true;
};

const resolveLink = (link, sourceRelativePath) => {
  if (!isRelativeLink(link)) {
    return link;
  }

  // Normalize GitHub case (complexity guide lives in lowercase file)
  let normalizedLink = link;
  if (link === 'COMPLEXITY_GUIDE.md') {
    normalizedLink = 'complexity-guide.md';
  }
  if (link === 'template/TASK_PLAN_TEMPLATE.md') {
    normalizedLink = '../90-templates/PLAN_TEMPLATE.md';
  }

  const normalizedSource = sourceRelativePath.split(path.sep).join('/');
  const sourceDir = path.posix.dirname(normalizedSource);
  let resolved = path.posix.normalize(path.posix.join(sourceDir, normalizedLink));

  if (resolved.startsWith('../')) {
    resolved = resolved.replace(/^\.\.\/+/, '');
  }

  try {
    const url = new URL(resolved, defaultBaseUrl);
    return url.toString();
  } catch (_error) {
    return link;
  }
};

const rewriteLinks = (markdown, sourceRelativePath) =>
  markdown.replace(/\]\(([^)]+)\)/g, (match, originalLink) => {
    const trimmed = originalLink.trim();
    const rewritten = resolveLink(trimmed, sourceRelativePath);
    return match.replace(originalLink, rewritten);
  });

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function collectMarkdownFiles(sourceDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORE_NAMES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(sourceDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectMarkdownFiles(fullPath);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function generateBundle(bundle) {
  const bundleLines = [];
  bundleLines.push(`# ${bundle.title}`);
  bundleLines.push('');
  bundleLines.push(`> Generated on ${new Date().toISOString()}`);

  let totalFiles = 0;

  for (const source of bundle.sources) {
    const sourcePath = path.join(repoRoot, source);
    let stats;
    try {
      stats = await fs.stat(sourcePath);
    } catch (error) {
      console.warn(`Skipping missing source: ${source}`);
      continue;
    }

    const sourceHeader = `\n\n---\n\n## Source Directory: ${source}\n`;
    bundleLines.push(sourceHeader.trimEnd());

    const filePaths = stats.isDirectory()
      ? await collectMarkdownFiles(sourcePath)
      : [sourcePath];

    filePaths.sort((a, b) => a.localeCompare(b));

    for (const filePath of filePaths) {
      const relativePath = path.relative(repoRoot, filePath);
      const content = await fs.readFile(filePath, 'utf8');
      const rewrittenContent = rewriteLinks(content, relativePath);
      bundleLines.push('');
      bundleLines.push(`### File: ${relativePath}`);
      bundleLines.push('');
      bundleLines.push(`<!-- Source: ${relativePath} -->`);
      bundleLines.push('');
      bundleLines.push(rewrittenContent.trimEnd());
      totalFiles += 1;
    }
  }

  bundleLines.push('');
  bundleLines.push(`_Included files: ${totalFiles}_`);

  const outputPath = path.join(outputDir, `${bundle.name}.md`);
  await ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, bundleLines.join('\n'), 'utf8');
  console.log(`Generated ${outputPath} (${totalFiles} files)`);
}

async function main() {
  await ensureDir(outputDir);

  for (const bundle of bundles) {
    await generateBundle(bundle);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
