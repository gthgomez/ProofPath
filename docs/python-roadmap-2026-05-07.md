# Python Roadmap - CareerForge

**Updated 2026-06-26 after improvements (design):** 0-9 spine complete with resilience (L8: retry/backoff/cache/circuit) + ops (L9: env/CI/secrets/deploy/monitor). All Python quizzes now 5Q/80%. Missions for api-resilience/ops wired + richer artifacts. Guard mechanics + pathlib explicit capsules/exercises. Early false-positive warns suppressed. Depth parity + review sims added. Full verify clean. See docs/python-lessons-next-design-2026-06-26.md .

## Professor Goal

The Python path should feel like one long apprenticeship, not a shelf of unrelated topics. Every lesson should answer:

- What skill am I learning?
- Why does it matter in real software work?
- What small thing will I build?
- How will I prove it works?
- How does it prepare me for the next project?

## Python Depth Standard

**Critique of the proposed standard:** the ladder/reps/checks/recall/project/review shape is the right spine because it turns lessons into inspectable skill growth instead of passive reading. The risk is weight: applying the full pattern to every tiny mobile lesson would make early lessons feel like paperwork. The missing hardening was a measurable selector for serious lessons, required failure cases, compact mobile-sized reps, module arcs, and tests that fail when depth is only prose.

**Hardened implementation standard:** a Python depth lesson is a serious applied, portfolio, capstone, or review lesson selected by validation. Each selected lesson must include:

- Concept ladder: objective, mental model, worked example, common mistakes, misconception check, guided exercise, and project connection.
- Practice reps: at least 3 reps covering new data, a failure or negative case, and a project-shaped variation.
- Code Lab check: at least 1 visible check and at least 1 hidden/negative check; network remains disabled.
- Recall layer: explain, debug, and transfer cards with specific prompts and answer hints.
- Project slice: a small artifact, exact check output, expected evidence, and one limitation or reflection.
- Review gate: architecture/structure summary, command evidence, failure/risk inspection, and one improvement decision.

Current enforcement lives in `scripts/validate-content.ts` and `tests/content-integrity.test.ts`. Python Professional and Python Integration arcs live in `src/domain/learning-path.ts`, so the Learn screen shows depth as staged arcs rather than one generic module list.

**Porting rule for future tracks:** TypeScript, SQL, Security, AI, Cloud, and Data should not copy Python syntax, but they should copy the depth shape: compact reps, visible plus negative checks, recall cards, project artifact, exact check output, and a review gate before a learner treats the module as portfolio-ready.

## Current Python Spine

The current path now starts with an absolute beginner ramp before moving into the original project-depth lessons:

1. Names, Values, and First Output
   - Skill: variables, strings, numbers, booleans, first inspectable output
   - Build: one study-session summary
   - Mission link: CLI Study Tracker

2. Lists and Dictionaries Hold Real Records
   - Skill: list of dictionaries as a repeated record shape
   - Build: two-session record list
   - Mission link: CLI Study Tracker

3. Decisions Make Scripts Useful
   - Skill: if/else conditions for meaningful labels
   - Build: focus vs quick session label
   - Mission link: CLI Study Tracker

4. Loops Turn Records Into Totals
   - Skill: for loops over records and running totals
   - Build: total study minutes
   - Mission link: CLI Study Tracker

5. Build the First Study Tracker Slice
   - Skill: combine values, records, decisions, loops, and output
   - Build: first complete study-tracker script slice
   - Mission link: CLI Study Tracker

6. Clean Text Before You Trust It
   - Skill: string cleanup with strip, lower, and replace
   - Build: normalized topic and slug
   - Mission link: CLI Study Tracker and Study Data Cleaner

7. Functions That Earn Their Name
   - Skill: pure-ish functions, inputs, returns, assertions
   - Build: study-minute grouper
   - Mission link: CLI Study Tracker

8. Read Errors Like a Developer
   - Skill: tracebacks, ValueError, try/except, explicit failure messages
   - Build: safe minutes parser
   - Mission link: CLI Study Tracker and Study Data Cleaner

9. Files Make Practice Real
   - Skill: parse input, reject bad rows, keep evidence
   - Build: safe row parser
   - Mission link: CLI Study Tracker and Study Data Cleaner

10. Tests That Catch Bad Input
   - Skill: regression tests for valid and invalid rows
   - Build: parser test suite
   - Mission link: Study Data Cleaner

11. Turn a Script Into a Command
   - Skill: real argparse command flags and parser boundaries
   - Build: reusable tracker command input
   - Mission link: CLI Study Tracker

12. Run the Tracker From a File
   - Skill: argparse --input, CSV records, and reproducible file-backed runs
   - Build: `python study_tracker.py --input sessions.csv`
   - Mission link: CLI Study Tracker

13. Polish the CLI Experience
   - Skill: --help output, defaults, choices, and guided argparse errors
   - Build: reviewer-friendly tracker command
   - Mission link: CLI Study Tracker

14. Write a Report File
   - Skill: --output paths, report formatting, and saved artifacts
   - Build: `summary.txt` from tracker totals
   - Mission link: CLI Study Tracker

15. Report Bad Rows Clearly
   - Skill: accepted/rejected parsing, row numbers, reasons, and raw-row evidence
   - Build: `rejected_rows.txt` report for messy input
   - Mission link: Study Data Cleaner

16. Package Python Work As Proof
   - Skill: README, verifier output, known gaps
   - Build: portfolio proof package
   - Mission link: ship one Python utility

17. Core Proof Review Gate
   - Skill: architecture explanation, command evidence, failure inspection, improvement choice
   - Build: module review artifact
   - Mission link: transition to Professional Python Utility

## Professional Python Utility Module

This module starts after the core Study Tracker path. It moves the learner from "my script works" to "my Python project is reviewable, maintainable, and testable."

1. Structure Python Like a Project
   - Skill: package layout, module boundaries, test location
   - Build: `study_tracker/cli.py`, `parser.py`, `reports.py`, and tests plan
   - Mission link: Professional Python Utility

2. Model Data With Dataclasses
   - Skill: typed `StudySession` model and validation
   - Build: dataclass plus parser conversion function
   - Mission link: Professional Python Utility

3. Produce JSON Reports
   - Skill: machine-readable report contracts
   - Build: stable JSON summary output
   - Mission link: Professional Python Utility

4. Log Failures Without Hiding Them
   - Skill: custom exceptions, project logger, failure context
   - Build: `TrackerInputError` and invalid-minutes logging
   - Mission link: Professional Python Utility

5. Prove It With Pytest and CI Commands
   - Skill: fixtures, behavior tests, CLI smoke commands
   - Build: repeatable verification plan
   - Mission link: Professional Python Utility

6. Declare the Project With pyproject.toml
   - Skill: project metadata, Python version requirements, pytest tool configuration
   - Build: minimal `pyproject.toml`
   - Mission link: Professional Python Utility

7. Make the CLI Installable
   - Skill: `[project.scripts]`, console entry points, installed command smoke tests
   - Build: `study-tracker = study_tracker.cli:main`
   - Mission link: Professional Python Utility

8. Load Configuration Without Surprises
   - Skill: config files, explicit defaults, safe merge behavior
   - Build: `tracker.config.json` loader
   - Mission link: Professional Python Utility

9. Set CI and Pre-Commit Expectations
   - Skill: local hooks, CI commands, lint/test/CLI smoke gates
   - Build: repeatable quality-gate checklist
   - Mission link: Professional Python Utility

10. Professional Utility Review Gate
    - Skill: maintainer review matrix across structure, metadata, command, config, logging, and tests
    - Build: professional review artifact
    - Mission link: transition to Python Integration Depth

## Python Integration Depth Module

This module closes the remaining advanced gaps by showing how professional Python connects with validation, stateful services, persistence, APIs, and final integration evidence.

1. Validate Text With Regex Carefully
   - Skill: focused regex validation with `re.fullmatch`
   - Build: date and slug validators
   - Mission link: Python Integration Service

2. Use Classes for Stateful Services
   - Skill: object-oriented service classes and isolated instance state
   - Build: `StudyTrackerService`
   - Mission link: Python Integration Service

3. Persist Sessions With SQLite
   - Skill: durable tables, inserts, aggregate queries
   - Build: `sessions` schema and total-by-topic query
   - Mission link: Python Integration Service

4. Call APIs Through a Safe Client
   - Skill: timeout, status, JSON shape validation, fake-client tests
   - Build: `fetch_sessions` API boundary
   - Mission link: Python Integration Service

5. Integrate the Professional Utility
   - Skill: layered architecture and integration evidence
   - Build: verification matrix across validation, service, SQLite, API, JSON, and CLI layers
   - Mission link: Python Integration Service

6. Integration Service Review Gate
   - Skill: final capstone review with layer evidence, final commands, risks, and improvements
   - Build: production-readiness review artifact
   - Mission link: Python Integration Service

## Roadmap To Professional Depth

### Stage 1 - Absolute Beginner Foundations

Goal: the student can read and write small Python programs without magic.

Lessons now implemented:

- Variables, strings, numbers, and booleans
- Lists and dictionaries as real data containers
- If/else decisions with plain-English conditions
- Loops over real records
- Foundation capstone that combines the beginner pieces
- Repeated fluency reps in the app UI before checkpoints
- Functions with inputs, return values, and assertions

Project thread:

- Build a small study tracker one slice at a time.

### Stage 2 - Practical Scripts

Goal: the student can turn messy input into useful output.

Lessons now implemented or deepened:

- Reading text and CSV-like input safely
- Parsing rows into dictionaries
- Handling missing columns and malformed minute values
- Real `argparse`, `--help`, defaults, choices, and guided argument errors
- Writing summaries to an output file
- Creating row-numbered rejected-row reports

Next lessons to add or deepen:

- Missing-file behavior and user-friendly file-not-found messages
- Date filtering and weekly summaries
- Writing machine-readable JSON output

Project thread:

- Turn the study tracker into a reusable CLI tool.

### Stage 3 - Testing And Debugging

Goal: the student can prove behavior instead of hoping it works.

Lessons to add:

- Assert statements vs pytest
- Test one happy path and one failure path
- Read traceback messages
- Debug with print/logging deliberately
- Refactor after tests pass

Project thread:

- Add a test suite to the CLI tool and capture verifier output.

### Stage 4 - Data And APIs

Goal: the student can use Python in real app workflows.

Lessons now implemented:

- JSON input/output
- Calling an API safely
- Validating API responses
- Saving local SQLite data
- Joining Python logic with SQL results
- Integration capstone with persistence, API boundaries, and CLI evidence

Next lessons to add or deepen:

- Real HTTP client library usage in a backend sandbox
- Pagination and retries
- SQLite migrations and indexes
- API authentication boundaries without exposing secrets

Project thread:

- Build a job-application tracker or evidence ledger CLI.

### Stage 5 - Professional Python

Goal: the student can produce reviewable, maintainable Python work.

Lessons now implemented:

- Project structure and modules
- Type hints and dataclasses or Pydantic-style validation
- JSON report contracts
- Error handling with custom exceptions
- Logging for failure context
- Pytest fixtures and CI-style verification commands
- `pyproject.toml` project metadata
- Installable CLI entry points
- Configuration files with explicit defaults
- CI and pre-commit quality-gate expectations

Next lessons to add or deepen:

- Environment-specific config profiles
- Dependency pinning and release/version strategy
- GitHub Actions YAML walkthrough
- SQLite migrations and API retry policies

Project thread:

- Ship a portfolio-ready Python utility with README, tests, sample data, and known gaps.

## Lesson Template

Each new lesson should use this format:

```text
Today you will build:
[one concrete artifact]

You are learning:
[one skill, not a topic cloud]

Why it matters:
[where this appears in real work]

Practice first:
[small starter code + expected output]

Checkpoint:
[2-4 questions that test the concept]

Mini-project:
[code lab task with visible and hidden tests]

Portfolio extension:
[how to preserve evidence outside the app]
```

## Recommendation

Add no more than 4-5 lessons per stage before adding a project mission. Depth comes from revisiting the same project with stronger constraints: cleaner functions, safer input, better tests, clearer evidence, then professional packaging.
