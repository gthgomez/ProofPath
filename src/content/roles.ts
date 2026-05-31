import type { RoleTarget } from "@/domain/types";

export const PATH_SOFTWARE_FOUNDATIONS_ID = "path-software-foundations";
export const PATH_BACKEND_API_DATA_ID = "path-backend-api-data";
export const PATH_SECURE_SOFTWARE_APPSEC_ID = "path-secure-software-appsec";
export const PATH_AI_PRODUCT_ENGINEERING_ID = "path-ai-product-engineering";

export const DEFAULT_ROLE_TARGET_ID = PATH_SOFTWARE_FOUNDATIONS_ID;

export const legacyCareerPathIdMap: Record<string, string> = {
  "role-junior-swe": PATH_SOFTWARE_FOUNDATIONS_ID,
  "role-python-fullstack": PATH_BACKEND_API_DATA_ID,
  "role-ai-app-fullstack": PATH_AI_PRODUCT_ENGINEERING_ID
};

export const roleTargets: RoleTarget[] = [
  {
    id: DEFAULT_ROLE_TARGET_ID,
    title: "Software Foundations",
    summary: "Build the shared proof base for modern software work: Python, TypeScript, SQL, Git, tests, and AI-output verification.",
    trackIds: ["track-python", "track-typescript", "track-sql", "track-git", "track-ai-tools"],
    default: true
  },
  {
    id: PATH_BACKEND_API_DATA_ID,
    title: "Backend, APIs & Data Systems",
    summary: "Build reliable services, API contracts, SQL-backed data models, and verifier-backed backend portfolio proof.",
    trackIds: ["track-python", "track-sql", "track-typescript", "track-git"],
    default: false
  },
  {
    id: PATH_SECURE_SOFTWARE_APPSEC_ID,
    title: "Secure Software & AppSec",
    summary: "Learn to build and review software with security habits: auth boundaries, secrets, data leakage, testing, and threat notes.",
    trackIds: ["track-git", "track-python", "track-sql", "track-typescript", "track-ai-tools"],
    default: false
  },
  {
    id: PATH_AI_PRODUCT_ENGINEERING_ID,
    title: "AI Product Engineering",
    summary: "Build AI-powered product features with TypeScript, model APIs, RAG, evals, guardrails, data boundaries, and cost notes.",
    trackIds: ["track-typescript", "track-ai-tools", "track-ai-apps", "track-sql", "track-python", "track-git"],
    default: false
  }
];

export const roleOnboardingCopy: Record<string, { bestFor: string; firstAction: string }> = {
  [DEFAULT_ROLE_TARGET_ID]: {
    bestFor: "Learners who want the broadest durable start before choosing backend/data, security, AI product, cloud, or ML unlocks.",
    firstAction: "open Today, finish the first Python lesson, and save one verifier output to Portfolio."
  },
  [PATH_BACKEND_API_DATA_ID]: {
    bestFor: "Backend and data-facing software work: APIs, SQL, data models, service contracts, and repeatable test proof.",
    firstAction: "complete the first Python lesson, then log one repo link plus test output for a small backend mission."
  },
  [PATH_SECURE_SOFTWARE_APPSEC_ID]: {
    bestFor: "Security-minded builders who want AppSec, secure coding, dependency hygiene, secrets discipline, and exploit/fix evidence.",
    firstAction: "start with Git evidence, then capture one note explaining what a verifier proves and what risk it does not cover."
  },
  [PATH_AI_PRODUCT_ENGINEERING_ID]: {
    bestFor: "Product engineering roles shipping LLM-backed features where TypeScript UI, evals, guardrails, and privacy boundaries matter.",
    firstAction: "start the TypeScript lesson, pass Code Lab checks, and capture one AI safety or eval decision in Portfolio."
  }
};

export const careerPathProgression = {
  core: {
    title: "Shared Core Proof",
    pathIds: [PATH_SOFTWARE_FOUNDATIONS_ID],
    opens: [PATH_BACKEND_API_DATA_ID, PATH_SECURE_SOFTWARE_APPSEC_ID, PATH_AI_PRODUCT_ENGINEERING_ID]
  },
  afterBackend: {
    title: "After Backend, APIs & Data Systems",
    opens: [
      "track-ai-apps",
      "track-analytics-systems",
      "track-cloud-platform-basics",
      "track-ml"
    ]
  },
  afterSecurity: {
    title: "After Secure Software & AppSec",
    opens: [
      "track-cloud-platform-basics",
      "track-ai-security",
      "track-privacy-governance"
    ]
  },
  afterAiProduct: {
    title: "After AI Product Engineering",
    opens: [
      "track-ml",
      "track-ai-platform",
      "track-product-analytics"
    ]
  }
} as const;
