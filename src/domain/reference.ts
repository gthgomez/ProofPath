import type { ConceptCategory, ConceptDefinition } from "../content/concepts";
import type { ConceptCapsule, ContentPack, Lesson, ProjectMission } from "./types";

export const conceptCategoryLabels: Record<ConceptCategory, string> = {
  computer: "Computer Basics",
  terminal: "Terminal",
  python: "Python",
  debugging: "Debugging",
  testing: "Testing",
  files: "Files & Folders",
  cli: "Command Line",
  project: "Projects",
  typing: "Typing",
  data: "Data",
  api: "APIs",
  ops: "Operations",
  git: "Git & GitHub",
  evidence: "Evidence"
};

export interface ConceptCategoryGroup {
  category: ConceptCategory;
  label: string;
  entries: ConceptIndexEntry[];
}

/**
 * Groups indexed concepts by registry category for the browsable reference
 * screen; categories and their entries are both alphabetized.
 */
export function groupConceptsByCategory(index: ConceptIndexEntry[]): ConceptCategoryGroup[] {
  const entriesByCategory = new Map<ConceptCategory, ConceptIndexEntry[]>();
  for (const entry of index) {
    const entries = entriesByCategory.get(entry.concept.category) ?? [];
    entries.push(entry);
    entriesByCategory.set(entry.concept.category, entries);
  }

  return [...entriesByCategory.entries()]
    .map(([category, entries]) => ({
      category,
      label: conceptCategoryLabels[category],
      entries: [...entries].sort((left, right) => left.concept.label.localeCompare(right.concept.label))
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export interface ConceptTeachingLocation {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  moduleTitle: string;
  trackId: string;
  trackTitle: string;
  level: number;
  capsule?: ConceptCapsule;
}

export interface ConceptIndexEntry {
  concept: ConceptDefinition;
  teachingLocations: ConceptTeachingLocation[];
  introducingLesson?: ConceptTeachingLocation;
  capsule?: ConceptCapsule;
  isSupportingOnly: boolean;
}

export interface ConceptSearchHit {
  entry: ConceptIndexEntry;
  score: number;
}

export interface LessonSearchHit {
  lesson: Lesson;
  score: number;
}

export interface MissionSearchHit {
  mission: ProjectMission;
  score: number;
}

export interface SearchResults {
  concepts: ConceptSearchHit[];
  lessons: LessonSearchHit[];
  missions: MissionSearchHit[];
}

interface LessonPlacement {
  lesson: Lesson;
  moduleId: string;
  moduleTitle: string;
  trackId: string;
  trackTitle: string;
  moduleSortOrder: number;
  level: number;
  sequence: number;
  positionInModule: number;
}

interface SearchField {
  text: string;
  priority: number;
}

interface ScoredHit<T> {
  item: T;
  score: number;
}

const MATCH_EXACT = 0;
const MATCH_PREFIX = 1;
const MATCH_SUBSTRING = 2;

function canonicalAliasMap(concepts: ConceptDefinition[]): Map<string, string> {
  const canonicalByAlias = new Map<string, string>();
  for (const concept of concepts) {
    for (const alias of concept.aliases ?? []) canonicalByAlias.set(alias, concept.id);
  }
  return canonicalByAlias;
}

/**
 * Active lessons in curriculum order (module sortOrder -> level -> sequence ->
 * position within the module). Deprecated lessons are invisible, matching the
 * validator's traversal.
 */
function buildLessonPlacements(content: ContentPack): LessonPlacement[] {
  const lessonById = new Map(content.lessons.map((lesson) => [lesson.id, lesson]));
  const trackById = new Map(content.tracks.map((track) => [track.id, track]));
  const placements: LessonPlacement[] = [];

  const orderedModules = [...content.modules].sort((left, right) => left.sortOrder - right.sortOrder);
  for (const moduleItem of orderedModules) {
    const track = trackById.get(moduleItem.trackId);
    moduleItem.lessonIds.forEach((lessonId, positionInModule) => {
      const lesson = lessonById.get(lessonId);
      if (!lesson || lesson.curriculum?.deprecated) return;
      placements.push({
        lesson,
        moduleId: moduleItem.id,
        moduleTitle: moduleItem.title,
        trackId: moduleItem.trackId,
        trackTitle: track?.title ?? moduleItem.trackId,
        moduleSortOrder: moduleItem.sortOrder,
        level: lesson.curriculum?.level ?? Number.MAX_SAFE_INTEGER,
        sequence: lesson.curriculum?.sequence ?? positionInModule,
        positionInModule
      });
    });
  }

  return placements.sort(
    (left, right) =>
      left.moduleSortOrder - right.moduleSortOrder ||
      left.level - right.level ||
      left.sequence - right.sequence ||
      left.positionInModule - right.positionInModule
  );
}

function teachingLocation(placement: LessonPlacement, capsule?: ConceptCapsule): ConceptTeachingLocation {
  return {
    lessonId: placement.lesson.id,
    lessonTitle: placement.lesson.title,
    moduleId: placement.moduleId,
    moduleTitle: placement.moduleTitle,
    trackId: placement.trackId,
    trackTitle: placement.trackTitle,
    level: placement.level,
    capsule
  };
}

/**
 * Joins the concept registry with curriculum metadata. The registry is not part
 * of ContentPack, so it is passed explicitly. Teaching references are
 * normalized through concept aliases, matching
 * `collectActiveConceptUsage` in scripts/validate-content.ts.
 */
export function buildConceptIndex(
  content: ContentPack,
  concepts: ConceptDefinition[]
): ConceptIndexEntry[] {
  const canonicalByAlias = canonicalAliasMap(concepts);
  const canonicalize = (conceptId: string): string => canonicalByAlias.get(conceptId) ?? conceptId;

  const locationsByConcept = new Map<string, ConceptTeachingLocation[]>();
  for (const placement of buildLessonPlacements(content)) {
    const capsulesByConceptId = new Map<string, ConceptCapsule>();
    for (const capsule of placement.lesson.depth?.conceptCapsules ?? []) {
      capsulesByConceptId.set(canonicalize(capsule.conceptId), capsule);
    }
    for (const rawConceptId of placement.lesson.curriculum?.teaches ?? []) {
      const conceptId = canonicalize(rawConceptId);
      const locations = locationsByConcept.get(conceptId) ?? [];
      locations.push(teachingLocation(placement, capsulesByConceptId.get(conceptId)));
      locationsByConcept.set(conceptId, locations);
    }
  }

  return concepts.map((concept) => {
    // Placements are iterated in curriculum order, so teachingLocations is the
    // chronological "taught in" list. The introduction prefers a lesson that
    // also ships the concept's capsule, since that page carries the reference
    // content; the registry description alone is one line.
    const teachingLocations = locationsByConcept.get(concept.id) ?? [];
    const introducingLesson = teachingLocations.find((location) => location.capsule) ?? teachingLocations[0];
    return {
      concept,
      teachingLocations,
      introducingLesson,
      capsule: introducingLesson?.capsule,
      isSupportingOnly: teachingLocations.length === 0
    };
  });
}

function normalizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function scoreToken(token: string, fields: SearchField[]): number | undefined {
  let best: number | undefined;
  for (const field of fields) {
    const matchKind =
      field.text === token
        ? MATCH_EXACT
        : field.text.startsWith(token)
          ? MATCH_PREFIX
          : field.text.includes(token)
            ? MATCH_SUBSTRING
            : undefined;
    if (matchKind === undefined) continue;
    const score = field.priority * 3 + matchKind;
    if (best === undefined || score < best) best = score;
  }
  return best;
}

/**
 * Sum over query tokens of the best field match; undefined when any token
 * fails to match (AND semantics across tokens).
 */
function scoreRecord(query: string[], fields: SearchField[]): number | undefined {
  let total = 0;
  for (const token of query) {
    const tokenScore = scoreToken(token, fields);
    if (tokenScore === undefined) return undefined;
    total += tokenScore;
  }
  return total;
}

function conceptFields(entry: ConceptIndexEntry): SearchField[] {
  return [
    { text: entry.concept.label.toLowerCase(), priority: 0 },
    ...(entry.concept.aliases ?? []).map((alias): SearchField => ({ text: alias.toLowerCase(), priority: 1 })),
    { text: entry.concept.id.toLowerCase(), priority: 2 },
    { text: entry.concept.description.toLowerCase(), priority: 3 }
  ];
}

function sortHits<T>(hits: ScoredHit<T>[], title: (item: T) => string): ScoredHit<T>[] {
  return hits
    .map((hit) => ({ hit, title: title(hit.item) }))
    .sort((left, right) => {
      if (left.hit.score !== right.hit.score) return left.hit.score - right.hit.score;
      if (left.title < right.title) return -1;
      if (left.title > right.title) return 1;
      return 0;
    })
    .map((entry) => entry.hit);
}

/**
 * Ranked search over concepts (label, aliases, id, description), active
 * lessons (title, summary), and missions (title, brief). Multi-token queries
 * use AND semantics; an empty query returns empty groups.
 */
export function searchContent(
  content: ContentPack,
  concepts: ConceptDefinition[],
  query: string
): SearchResults {
  const queryTokens = normalizeQuery(query);
  if (queryTokens.length === 0) {
    return { concepts: [], lessons: [], missions: [] };
  }

  const conceptHits = sortHits(
    buildConceptIndex(content, concepts)
      .map((entry): ScoredHit<ConceptIndexEntry> | undefined => {
        const score = scoreRecord(queryTokens, conceptFields(entry));
        return score === undefined ? undefined : { item: entry, score };
      })
      .filter((hit): hit is ScoredHit<ConceptIndexEntry> => Boolean(hit)),
    (entry) => entry.concept.label
  ).map((hit) => ({ entry: hit.item, score: hit.score }));

  const lessonHits = sortHits(
    content.lessons
      .filter((lesson) => !lesson.curriculum?.deprecated)
      .map((lesson): ScoredHit<Lesson> | undefined => {
        const score = scoreRecord(queryTokens, [
          { text: lesson.title.toLowerCase(), priority: 0 },
          { text: lesson.summary.toLowerCase(), priority: 1 }
        ]);
        return score === undefined ? undefined : { item: lesson, score };
      })
      .filter((hit): hit is ScoredHit<Lesson> => Boolean(hit)),
    (lesson) => lesson.title
  ).map((hit) => ({ lesson: hit.item, score: hit.score }));

  const missionHits = sortHits(
    content.projectMissions
      .map((mission): ScoredHit<ProjectMission> | undefined => {
        const score = scoreRecord(queryTokens, [
          { text: mission.title.toLowerCase(), priority: 0 },
          { text: mission.brief.toLowerCase(), priority: 1 }
        ]);
        return score === undefined ? undefined : { item: mission, score };
      })
      .filter((hit): hit is ScoredHit<ProjectMission> => Boolean(hit)),
    (mission) => mission.title
  ).map((hit) => ({ mission: hit.item, score: hit.score }));

  return { concepts: conceptHits, lessons: lessonHits, missions: missionHits };
}
