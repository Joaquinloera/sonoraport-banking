"use strict";

const fs = require("fs");
const path = require("path");

const SOURCE_CONFIG_PATH = path.join(
  __dirname,
  "worldsandbox13-github-source.json"
);

const REGISTRY_INDEX_PATH = path.join(
  __dirname,
  "worldsandbox13-registry-index.json"
);

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const sourceConfig = loadJson(SOURCE_CONFIG_PATH);
const registryIndex = loadJson(REGISTRY_INDEX_PATH);

const OWNER = sourceConfig.github.owner;
const REPOSITORY = sourceConfig.github.repository;
const BRANCH = sourceConfig.github.branch || "main";

const API_BASE =
  `https://api.github.com/repos/${OWNER}/${REPOSITORY}`;

function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "sonoraport-banking-worldsandbox13-reader"
  };

  const token = process.env.WORLDSANDBOX13_GITHUB_TOKEN;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function githubGet(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: githubHeaders()
  });

  if (!response.ok) {
    throw new Error(
      `Worldsanbox13 GitHub read failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

async function repositoryStatus() {
  const repo = await githubGet(API_BASE);

  return {
    connected: true,
    repository: repo.full_name,
    defaultBranch: repo.default_branch,
    requestedBranch: BRANCH,
    mode: "READ_ONLY"
  };
}

function approvedRegistry(registryId) {
  const registry = registryIndex.registries.find(
    (item) => item.id === registryId
  );

  if (!registry) {
    throw new Error(
      `Registry is not approved for Banking access: ${registryId}`
    );
  }

  return registry;
}

function validateRegistryPath(filePath) {
  if (
    typeof filePath !== "string" ||
    !filePath.endsWith(".json") ||
    filePath.includes("..") ||
    filePath.startsWith("/") ||
    filePath.includes("\\")
  ) {
    throw new Error("Invalid Worldsanbox13 registry path");
  }
}

async function readJsonFile(filePath) {
  validateRegistryPath(filePath);

  const encodedPath = filePath
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const url =
    `${API_BASE}/contents/${encodedPath}` +
    `?ref=${encodeURIComponent(BRANCH)}`;

  const file = await githubGet(url);

  if (file.type !== "file") {
    throw new Error(`Expected file: ${filePath}`);
  }

  if (!file.content || file.encoding !== "base64") {
    throw new Error(
      `Unsupported GitHub content response for ${filePath}`
    );
  }

  const raw = Buffer.from(
    file.content.replace(/\n/g, ""),
    "base64"
  ).toString("utf8");

  let data;

  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Invalid JSON in Worldsanbox13 registry ${filePath}: ${error.message}`
    );
  }

  return {
    data,
    provenance: {
      authority: "Worldsanbox13",
      repository: `${OWNER}/${REPOSITORY}`,
      branch: BRANCH,
      path: filePath,
      blobSha: file.sha,
      mode: "READ_ONLY"
    }
  };
}

async function readApprovedRegistry(registryId) {
  const registry = approvedRegistry(registryId);

  const result = await readJsonFile(registry.path);

  return {
    registryId,
    ...result
  };
}

async function verifyApprovedRegistries() {
  const results = [];

  for (const registry of registryIndex.registries) {
    try {
      const result = await readApprovedRegistry(registry.id);

      results.push({
        registryId: registry.id,
        path: registry.path,
        blobSha: result.provenance.blobSha,
        readable: true,
        jsonValid: true
      });
    } catch (error) {
      results.push({
        registryId: registry.id,
        path: registry.path,
        readable: false,
        jsonValid: false,
        error: error.message
      });
    }
  }

  return {
    repository: `${OWNER}/${REPOSITORY}`,
    branch: BRANCH,
    mode: "READ_ONLY",
    expectedRegistries: registryIndex.registries.length,
    verifiedRegistries:
      results.filter((item) => item.readable && item.jsonValid).length,
    ok: results.every(
      (item) => item.readable && item.jsonValid
    ),
    results
  };
}

module.exports = {
  repositoryStatus,
  readJsonFile,
  readApprovedRegistry,
  verifyApprovedRegistries,
  approvedRegistry,
  registryIndex
};
