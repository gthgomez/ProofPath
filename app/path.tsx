import { Link, Redirect } from "expo-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { contentPack } from "@/content/seed";
import { findMission, getLessonsForModule, getModulesForTrack } from "@/domain/content";
import {
  formatEstimatedMinutes,
  getLessonArcs,
  getLessonCtaRule,
  getLessonStatus,
  getMissionReadiness,
  getModuleCtaLabel,
  getModuleStatus,
  getNextLessonId,
  type LessonArc,
  type LessonStatus,
  type MissionStatus
} from "@/domain/learning-path";
import { getTracksForRole } from "@/domain/role-routing";
import type { Lesson, Module, ProjectMission } from "@/domain/types";
import { Badge, BodyText, ButtonShell, MutedText, Panel, ProgressBar, Row, Screen, SectionTitle, SubPanel } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { colors, radius, semanticColors, spacing } from "@/ui/theme";
import { useProgress } from "@/state/progress-provider";

export default function LearningPathScreen(): ReactElement {
  const { progress, roleTarget } = useProgress();
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const tracks = getTracksForRole(contentPack, roleTarget.id);

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading Learn">
        <Panel accessibilityLabel="Loading Learn" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before routing Learn.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen eyebrow={roleTarget.title} title="Learn">
      <Panel>
        <SectionTitle>career path</SectionTitle>
        <BodyText>{roleTarget.summary}</BodyText>
        <Link href="/onboarding" asChild>
          <ButtonShell accessibilityHint="Changes which tracks appear in Learn." tone="rose" variant="secondary">Change career path</ButtonShell>
        </Link>
      </Panel>

      {tracks.length === 0 ? (
        <Panel>
          <SectionTitle>No Learn tracks for this path yet</SectionTitle>
          <MutedText>Choose another career path or add path track mappings to the local content pack.</MutedText>
        </Panel>
      ) : null}

      {tracks.map((track) => {
        const modules = getModulesForTrack(contentPack, track.id);

        return (
          <Panel key={track.id}>
            <Row>
              <Badge>{track.roleTargets[0]}</Badge>
              <Badge tone="teal">{track.moduleIds.length} module</Badge>
            </Row>
            <SectionTitle>{track.title}</SectionTitle>
            <MutedText>{track.summary}</MutedText>
            {modules.map((moduleItem, moduleIndex) => {
              const nextModule = modules[moduleIndex + 1];

              return (
                <ModuleRoadmap
                  key={moduleItem.id}
                  moduleItem={moduleItem}
                  nextModule={nextModule}
                  progress={progress}
                />
              );
            })}
          </Panel>
        );
      })}
    </Screen>
  );
}

interface ModuleRoadmapProps {
  moduleItem: Module;
  nextModule?: Module;
  progress: ReturnType<typeof useProgress>["progress"];
}

function ModuleRoadmap({ moduleItem, nextModule, progress }: ModuleRoadmapProps): ReactElement {
  const lessons = getLessonsForModule(contentPack, moduleItem.id);
  const firstLesson = lessons[0];
  const nextLessonId = getNextLessonId(lessons, progress);
  const activeLesson = lessons.find((lesson) => lesson.id === nextLessonId);
  const completedLessons = lessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
  const missions = moduleItem.projectMissionIds
    .map((missionId) => findMission(contentPack, missionId))
    .filter((mission): mission is ProjectMission => Boolean(mission));
  const completedMissions = missions.filter((mission) => progress.completedProjectMissionIds.includes(mission.id)).length;
  const moduleStatus = getModuleStatus(lessons, missions, progress);
  const moduleCtaLabel = getModuleCtaLabel(moduleItem, lessons, missions, progress);
  const arcs = getLessonArcs(moduleItem, lessons);
  const activeArc = arcs.find((arc) => arc.lessonIndexes.some((lessonIndex) => lessons[lessonIndex]?.id === activeLesson?.id)) ?? arcs[0];
  const [expandedArcIds, setExpandedArcIds] = useState<string[]>(() => activeArc ? [activeArc.id] : []);
  const lessonProgress = lessons.length === 0 ? 0 : (completedLessons / lessons.length) * 100;
  const missionProgress = missions.length === 0 ? 0 : (completedMissions / missions.length) * 100;

  function toggleArc(arcId: string): void {
    setExpandedArcIds((currentIds) => currentIds.includes(arcId)
      ? currentIds.filter((currentId) => currentId !== arcId)
      : [...currentIds, arcId]);
  }

  const moduleHref = moduleStatus === "mission_ready" && missions[0]
    ? { pathname: "/mission/[missionId]" as const, params: { missionId: missions[0].id } }
    : { pathname: "/lesson/[lessonId]" as const, params: { lessonId: activeLesson?.id ?? firstLesson?.id ?? "" } };

  return (
    <View style={styles.moduleItem}>
      <Row>
        <Badge tone={moduleStatus === "completed" ? "green" : moduleStatus === "mission_ready" ? "amber" : "blue"}>
          {moduleStatus.replace("_", " ")}
        </Badge>
        <Badge tone="green">{completedLessons}/{lessons.length} lessons</Badge>
        <Badge tone="amber">{completedMissions}/{missions.length} missions</Badge>
      </Row>

      <SectionTitle>{moduleItem.title}</SectionTitle>
      <BodyText>{moduleItem.summary}</BodyText>

      {firstLesson ? (
        <SubPanel accessibilityLabel={`Continue card for ${moduleItem.title}`}>
          <Row>
            <Badge tone="blue">Next up</Badge>
            {activeLesson ? <Badge tone="teal">{activeLesson.estimatedMinutes} min</Badge> : <Badge tone="amber">Build gate</Badge>}
          </Row>
          <SectionTitle>{activeLesson ? activeLesson.title : "Build missions ready"}</SectionTitle>
          <MutedText>
            {activeLesson
              ? `You are here. Finish this lesson to move ${moduleItem.title} closer to portfolio proof.`
              : "Lessons are complete. Turn the module into project evidence with Build."}
          </MutedText>
          <Link href={moduleHref} asChild>
            <ButtonShell accessibilityHint={`Opens the next action for ${moduleItem.title}.`} tone={moduleStatus === "mission_ready" ? "amber" : "blue"}>
              {moduleCtaLabel}
            </ButtonShell>
          </Link>
        </SubPanel>
      ) : null}

      <View style={styles.progressGrid}>
        <ProgressBar label={`${moduleItem.title} lessons`} value={lessonProgress} />
        {missions.length > 0 ? <ProgressBar label={`${moduleItem.title} missions`} tone="amber" value={missionProgress} /> : null}
      </View>

      <SectionTitle>Arc progress</SectionTitle>
      {arcs.map((arc) => (
        <ArcRoadmap
          activeLessonId={activeLesson?.id}
          arc={arc}
          expanded={expandedArcIds.includes(arc.id)}
          key={arc.id}
          lessons={lessons}
          onToggle={() => toggleArc(arc.id)}
          progress={progress}
        />
      ))}

      {missions.length > 0 ? (
        <View style={styles.missionSection}>
          <SectionTitle>Build</SectionTitle>
          <BodyText>Build missions turn this module into proof you can show, explain, and verify.</BodyText>
          {missions.map((mission, missionIndex) => (
            <MissionCard key={mission.id} lessons={lessons} mission={mission} missionIndex={missionIndex} progress={progress} />
          ))}
        </View>
      ) : null}

      {nextModule ? (
        <SubPanel>
          <Row>
            <Badge tone="ink">Next module</Badge>
          </Row>
          <SectionTitle>{nextModule.title}</SectionTitle>
          <MutedText>{nextModule.summary}</MutedText>
        </SubPanel>
      ) : null}
    </View>
  );
}

interface ArcRoadmapProps {
  activeLessonId?: string;
  arc: LessonArc;
  expanded: boolean;
  lessons: Lesson[];
  onToggle: () => void;
  progress: ReturnType<typeof useProgress>["progress"];
}

function ArcRoadmap({ activeLessonId, arc, expanded, lessons, onToggle, progress }: ArcRoadmapProps): ReactElement {
  const arcLessons = arc.lessonIndexes
    .map((lessonIndex) => lessons[lessonIndex])
    .filter((lesson): lesson is Lesson => Boolean(lesson));
  const completedCount = arcLessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
  const containsActiveLesson = arcLessons.some((lesson) => lesson.id === activeLessonId);

  return (
    <View style={[styles.arcBlock, containsActiveLesson ? styles.arcBlockCurrent : null]}>
      <Row>
        <Badge tone={completedCount === arcLessons.length ? "green" : containsActiveLesson ? "blue" : "teal"}>
          {containsActiveLesson ? "you are here" : `${completedCount}/${arcLessons.length}`}
        </Badge>
        <Badge tone="teal">{formatEstimatedMinutes(arcLessons)}</Badge>
      </Row>
      <SectionTitle>{arc.title}</SectionTitle>
      {arc.missionHint ? <MutedText>{arc.missionHint}</MutedText> : null}
      <ButtonShell
        accessibilityHint={expanded ? `Collapses ${arc.title}.` : `Expands ${arc.title}.`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        size="compact"
        tone="ink"
        variant="tertiary"
      >
        {expanded ? "Hide lessons" : `Show ${arcLessons.length} lessons`}
      </ButtonShell>
      {expanded ? (
        <View style={styles.lessonList}>
          {arcLessons.map((lesson) => {
            const status = getLessonStatus(lesson, lessons, progress);
            const position = lessons.findIndex((candidate) => candidate.id === lesson.id) + 1;

            return (
              <LessonCard
                activeLessonId={activeLessonId}
                key={lesson.id}
                lesson={lesson}
                position={position}
                status={status}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

interface LessonCardProps {
  activeLessonId?: string;
  lesson: Lesson;
  position: number;
  status: LessonStatus;
}

function LessonCard({ activeLessonId, lesson, position, status }: LessonCardProps): ReactElement {
  const cta = getLessonCtaRule(status);
  const isActive = lesson.id === activeLessonId || status === "current";
  const ctaVariant = isActive || status === "completed" ? cta.variant : "secondary";

  return (
    <View style={[
      styles.roadmapItem,
      isActive ? styles.roadmapItemCurrent : null,
      status === "completed" ? styles.roadmapItemComplete : null
    ]}>
      <Row>
        <Badge tone={lessonBadgeTone(status)}>{lessonBadgeText(status, position)}</Badge>
        <Badge tone="teal">{lesson.estimatedMinutes} min</Badge>
        <Badge tone="amber">{lesson.workshop.language}</Badge>
      </Row>
      <SectionTitle>{lesson.title}</SectionTitle>
      <MutedText>{lesson.summary}</MutedText>
      <MutedText>Build: {lesson.workshop.miniProject.title}</MutedText>
      <MutedText>Proof: {lesson.workshop.miniProject.expectedEvidence}</MutedText>
      <Link href={{ pathname: "/lesson/[lessonId]", params: { lessonId: lesson.id } }} asChild>
        <ButtonShell
          accessibilityHint={`Opens ${lesson.title}.`}
          size={isActive ? "full" : "compact"}
          tone={cta.tone}
          variant={ctaVariant}
        >
          {isActive ? cta.label : cta.label}
        </ButtonShell>
      </Link>
    </View>
  );
}

interface MissionCardProps {
  lessons: Lesson[];
  mission: ProjectMission;
  missionIndex: number;
  progress: ReturnType<typeof useProgress>["progress"];
}

function MissionCard({ lessons, mission, missionIndex, progress }: MissionCardProps): ReactElement {
  const readiness = getMissionReadiness(mission, lessons, progress);
  const completed = readiness.status === "completed";
  const primaryMissionAction = readiness.status === "ready" || readiness.status === "in_progress";

  return (
    <View style={[
      styles.roadmapItem,
      primaryMissionAction ? styles.missionReady : null,
      completed ? styles.roadmapItemComplete : null
    ]}>
      <Row>
        <Badge tone={completed ? "green" : missionBadgeTone(readiness.status)}>
          {completed ? "done" : `mission ${missionIndex + 1}`}
        </Badge>
        <Badge tone="teal">{mission.difficulty}</Badge>
        <Badge tone={missionBadgeTone(readiness.status)}>{missionStatusText(readiness.status)}</Badge>
      </Row>
      <SectionTitle>{mission.title}</SectionTitle>
      <MutedText>{mission.brief}</MutedText>
      <MutedText>{readiness.dependencyText}</MutedText>
      <MutedText>Artifacts: {mission.expectedArtifacts.slice(0, 3).join(", ")}</MutedText>
      <Link href={{ pathname: "/mission/[missionId]", params: { missionId: mission.id } }} asChild>
        <ButtonShell
          accessibilityHint={`Opens ${mission.title}.`}
          size={primaryMissionAction ? "full" : "compact"}
          tone={completed ? "ink" : "amber"}
          variant={primaryMissionAction ? "primary" : "secondary"}
        >
          {completed ? "Review mission" : primaryMissionAction ? "Open mission" : "Preview mission"}
        </ButtonShell>
      </Link>
    </View>
  );
}

function lessonBadgeText(status: LessonStatus, position: number): string {
  if (status === "completed") {
    return "complete";
  }

  if (status === "current") {
    return `current ${position}`;
  }

  if (status === "in_progress") {
    return "continue";
  }

  if (status === "locked") {
    return "Not earned yet";
  }

  return `lesson ${position}`;
}

function lessonBadgeTone(status: LessonStatus): "blue" | "teal" | "amber" | "rose" | "green" | "ink" {
  if (status === "completed") {
    return "green";
  }

  if (status === "current" || status === "in_progress") {
    return "blue";
  }

  if (status === "locked") {
    return "ink";
  }

  return "teal";
}

function missionBadgeTone(status: MissionStatus): "blue" | "teal" | "amber" | "rose" | "green" | "ink" {
  if (status === "completed") {
    return "green";
  }

  if (status === "ready" || status === "in_progress") {
    return "amber";
  }

  return "ink";
}

function missionStatusText(status: MissionStatus): string {
  if (status === "locked") {
    return "Not earned yet";
  }

  return status.replace("_", " ");
}

const styles = StyleSheet.create({
  moduleItem: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.md,
    paddingTop: spacing.md
  },
  progressGrid: {
    gap: spacing.sm
  },
  arcBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  arcBlockCurrent: {
    borderColor: colors.blue,
    borderWidth: 2
  },
  lessonList: {
    gap: spacing.sm
  },
  roadmapItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  roadmapItemCurrent: {
    backgroundColor: semanticColors.lessonSoft,
    borderColor: semanticColors.lessonPrimary,
    borderLeftWidth: 5,
    borderWidth: 2
  },
  roadmapItemComplete: {
    backgroundColor: semanticColors.successSoft,
    borderColor: semanticColors.success
  },
  missionReady: {
    backgroundColor: semanticColors.missionSoft,
    borderColor: semanticColors.missionPrimary,
    borderLeftWidth: 5,
    borderWidth: 2
  },
  missionSection: {
    gap: spacing.sm
  }
});
