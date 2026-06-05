import type { RoleTarget } from "@/domain/types";

export const PATH_SOFTWARE_FOUNDATIONS_ID = "path-software-foundations";
export const PATH_BACKEND_API_DATA_ID = "path-backend-api-data";
export const PATH_SECURE_SOFTWARE_APPSEC_ID = "path-secure-software-appsec";
export const PATH_AI_PRODUCT_ENGINEERING_ID = "path-ai-product-engineering";

export const DEFAULT_ROLE_TARGET_ID = PATH_SOFTWARE_FOUNDATIONS_ID;

export const PATH_PROOF_CORE_ID = "proof-shared-core";
export const PATH_PROOF_BACKEND_ID = "proof-backend-api-data";
export const PATH_PROOF_SECURITY_ID = "proof-secure-software-appsec";
export const PATH_PROOF_AI_PRODUCT_ID = "proof-ai-product-engineering";

export type CareerUnlockKind = "path" | "track";

export interface CareerUnlock {
  id: string;
  kind: CareerUnlockKind;
  title: string;
}

export interface PathProofGate {
  id: string;
  pathId: string;
  title: string;
  summary: string;
  requiredMissionIds: string[];
  unlocks: CareerUnlock[];
}

export const legacyCareerPathIdMap: Record<string, string> = {
  "role-junior-swe": PATH_SOFTWARE_FOUNDATIONS_ID,
  "role-python-fullstack": PATH_BACKEND_API_DATA_ID,
  "role-ai-app-fullstack": PATH_AI_PRODUCT_ENGINEERING_ID
};

export const roleTargets: RoleTarget[] = [
  {
    id: DEFAULT_ROLE_TARGET_ID,
    title: "Intern Generalist",
    summary: "Build the shared skill base for modern software work: Python, TypeScript, SQL, Git, tests, and AI-output verification.",
    trackIds: ["track-python", "track-typescript", "track-sql", "track-git", "track-testing-debugging", "track-ai-tools"],
    default: true
  },
  {
    id: PATH_BACKEND_API_DATA_ID,
    title: "Backend, APIs & Data Systems",
    summary: "Build reliable services, API contracts, SQL-backed data models, and checked backend portfolio work.",
    trackIds: ["track-python", "track-sql", "track-typescript", "track-git"],
    default: false
  },
  {
    id: PATH_SECURE_SOFTWARE_APPSEC_ID,
    title: "AppSec & Secure Software",
    summary: "Learn to build and review software with security habits: auth boundaries, secrets, data leakage, testing, and threat notes.",
    trackIds: ["track-secure-software", "track-git", "track-python", "track-sql", "track-typescript", "track-ai-tools"],
    default: false
  },
  {
    id: PATH_AI_PRODUCT_ENGINEERING_ID,
    title: "AI Product Features (TS-Led)",
    summary: "Build AI-powered product features with TypeScript, model APIs, RAG, evals, guardrails, data boundaries, and cost notes.",
    trackIds: ["track-typescript", "track-ai-tools", "track-ai-apps", "track-sql", "track-python", "track-git"],
    default: false
  }
];

export const roleOnboardingCopy: Record<string, { bestFor: string; firstAction: string }> = {
  [DEFAULT_ROLE_TARGET_ID]: {
    bestFor: "Learners who want the broadest durable start before choosing backend/data, security, AI product, cloud, or ML unlocks.",
    firstAction: "open Today, finish the first Python lesson, and save one passing Code Lab check to Portfolio."
  },
  [PATH_BACKEND_API_DATA_ID]: {
    bestFor: "Backend and data-facing software work: APIs, SQL, data models, service contracts, and repeatable tests.",
    firstAction: "complete the first Python lesson, then log one repo link plus test output for a small backend mission."
  },
  [PATH_SECURE_SOFTWARE_APPSEC_ID]: {
    bestFor: "Security-minded builders who want AppSec, secure coding, dependency hygiene, secrets discipline, and exploit/fix evidence.",
    firstAction: "start with Git evidence, then capture one note explaining what a check confirms and what risk it does not cover."
  },
  [PATH_AI_PRODUCT_ENGINEERING_ID]: {
    bestFor: "Product engineering roles shipping LLM-backed features where TypeScript UI, evals, guardrails, and privacy boundaries matter.",
    firstAction: "start the TypeScript lesson, pass Code Lab checks, and capture one AI safety or eval decision in Portfolio."
  }
};

export const careerPathProgression = {
  core: {
    title: "Shared Core Readiness",
    pathIds: [PATH_SOFTWARE_FOUNDATIONS_ID],
    opens: [PATH_BACKEND_API_DATA_ID, PATH_SECURE_SOFTWARE_APPSEC_ID, PATH_AI_PRODUCT_ENGINEERING_ID]
  },
  afterBackend: {
    title: "After Backend, APIs & Data Systems",
    opens: [
      "track-data-systems",
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

export const pathProofGates: PathProofGate[] = [
  {
    id: PATH_PROOF_CORE_ID,
    pathId: PATH_SOFTWARE_FOUNDATIONS_ID,
    title: "Shared Core Readiness Gate",
    summary: "Complete representative beginner projects across Python, TypeScript, Git, testing, and AI verification before treating specialization paths as earned.",
    requiredMissionIds: [
      "mission-cli-study-tracker",
      "mission-web-progress-board",
      "mission-portfolio-readme",
      "mission-regression-proof-pack",
      "mission-ai-test-harness"
    ],
    unlocks: [
      { id: PATH_BACKEND_API_DATA_ID, kind: "path", title: "Backend, APIs & Data Systems" },
      { id: PATH_SECURE_SOFTWARE_APPSEC_ID, kind: "path", title: "Secure Software & AppSec" },
      { id: PATH_AI_PRODUCT_ENGINEERING_ID, kind: "path", title: "AI Product Engineering" }
    ]
  },
  {
    id: PATH_PROOF_BACKEND_ID,
    pathId: PATH_BACKEND_API_DATA_ID,
    title: "Backend Readiness Gate",
    summary: "Show that backend work is more than syntax with checked API contracts, persistence, integration behavior, and reviewer-ready evidence.",
    requiredMissionIds: [
      "mission-api-contract-playground",
      "mission-job-tracker-schema",
      "mission-python-integration-service"
    ],
    unlocks: [
      { id: "track-data-systems", kind: "track", title: "Data Systems" },
      { id: "track-cloud-platform-basics", kind: "track", title: "Cloud Platform Basics" },
      { id: "track-ai-apps", kind: "track", title: "Practical AI Apps" },
      { id: "track-ml", kind: "track", title: "ML Foundations" },
      { id: "track-analytics-systems", kind: "track", title: "Analytics Systems" }
    ]
  },
  {
    id: PATH_PROOF_SECURITY_ID,
    pathId: PATH_SECURE_SOFTWARE_APPSEC_ID,
    title: "Security Readiness Gate",
    summary: "Show AppSec habits through a review pack that names risks, fixes, verification, and residual limitations.",
    requiredMissionIds: ["mission-secure-review-pack"],
    unlocks: [
      { id: "track-cloud-platform-basics", kind: "track", title: "Cloud Platform Basics" },
      { id: "track-ai-security", kind: "track", title: "AI Security" },
      { id: "track-privacy-governance", kind: "track", title: "Privacy Governance" }
    ]
  },
  {
    id: PATH_PROOF_AI_PRODUCT_ID,
    pathId: PATH_AI_PRODUCT_ENGINEERING_ID,
    title: "AI Product Readiness Gate",
    summary: "Show an AI product slice with boundaries, evals, retrieval grounding, privacy notes, and cost-aware evidence.",
    requiredMissionIds: ["mission-ai-study-planner", "mission-rag-notes-prototype"],
    unlocks: [
      { id: "track-ml", kind: "track", title: "ML Foundations" },
      { id: "track-ai-platform", kind: "track", title: "AI Platform" },
      { id: "track-product-analytics", kind: "track", title: "Product Analytics" }
    ]
  }
];
