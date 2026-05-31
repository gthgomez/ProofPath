for future: "Yes — **worth it as a personal career-prep app**, but **not worth it if your goal is to “compete with SoloLearn/freeCodeCamp” as a generic learning platform**.

The winning version is not “SoloLearn + freeCodeCamp clone.” The winning version is:

> **A personal AI-era SWE training cockpit that tells you what to study next, makes you build proof projects, tracks evidence, and adapts to 2026 job-market skill demands.**

That would actually fit your strengths: Babel, governance, evidence gates, project-based learning, Python, TypeScript, Supabase, AI tooling, and career prep.

## My verdict

**GREEN for personal use / portfolio project.**
**YELLOW for SaaS/business potential.**
**RED if you try to rebuild full SoloLearn/freeCodeCamp content from scratch.**

The reason is simple: SoloLearn and freeCodeCamp already have huge content libraries. Your advantage would not be “more lessons.” Your advantage would be **personalized pathing, evidence-based progress, AI-guided projects, job-market adaptation, and portfolio readiness**.

## Why this makes sense in 2026

The software job market is moving away from “I know syntax” and toward “I can build, debug, verify, use AI responsibly, and ship.” Stack Overflow’s 2025 survey says over **36% of developers learned AI-enabled tools for their job or career in the last year**, and their survey included focus on AI agents, LLMs, and developer tool changes. ([Stack Overflow][1])

The World Economic Forum’s Future of Jobs 2025 says employers expect **39% of key job-market skills to change by 2030**, with AI, information processing, robotics, and automation among the most transformative forces. It also identifies technology-related roles as among the fastest-growing categories by 2030. ([World Economic Forum][2])

At the same time, AI is not simply deleting SWE; it is changing what SWE means. A 2026 WEF piece says developers are becoming an “AI-native workforce,” with many expecting their roles to keep changing in 2026. ([World Economic Forum][3]) That supports the idea that a career-prep app should train **AI-assisted engineering**, not just old-school coding quizzes.

## What you should build instead of a clone

Build an app with **four layers**:

### 1. Learning path engine

This is the SoloLearn-style part.

It should teach:

| Track                 | Why it matters                                                         |
| --------------------- | ---------------------------------------------------------------------- |
| Python Fundamentals   | Still one of the best entry points for automation, data, AI, scripting |
| JavaScript/TypeScript | Needed for web apps, SaaS, front-end, full-stack                       |
| SQL/Postgres          | Essential for real apps, analytics, backend work                       |
| Git/GitHub            | Required for employability and portfolio proof                         |
| APIs/HTTP/Auth        | Real-world app-building foundation                                     |
| Testing/Debugging     | Huge junior-dev differentiator                                         |
| AI Tooling            | Codex, Claude, Gemini, prompts, evals, tool-use, verification          |
| ML/AI Foundations     | Not deep PhD ML first; practical model usage, datasets, evaluation     |
| Portfolio Projects    | The thing employers actually care about                                |

Do **not** start by trying to write 500 lessons. Start with 30–50 high-value modules.

### 2. Project lab

This is the freeCodeCamp-style part.

Every path should end in a project. For example:

| Level      | Project                                                     |
| ---------- | ----------------------------------------------------------- |
| Python 1   | CLI calculator / budget tracker                             |
| Python 2   | File organizer / CSV analyzer                               |
| SQL        | Personal job tracker with Postgres                          |
| Web        | Portfolio page + API backend                                |
| AI         | Resume/job-description matcher                              |
| ML         | Small classifier with evaluation report                     |
| Full-stack | Career dashboard with auth + database                       |
| Capstone   | “AI Career Coach” that generates weekly study/project plans |

The app should not say “you completed Python because you watched lessons.” It should say:
**“You completed Python because you built X, passed tests, and produced evidence.”**

That is much stronger.

### 3. Evidence-based skill graph

This is where your app can beat SoloLearn/freeCodeCamp for your personal use.

Instead of simple XP, track:

| Evidence          | Example                                   |
| ----------------- | ----------------------------------------- |
| Concept mastered  | “Can write functions with parameters”     |
| Challenge passed  | “Solved 8/10 loop problems”               |
| Project shipped   | “Built CLI expense tracker”               |
| GitHub proof      | Commit link, README, tests                |
| AI-assisted proof | Prompt used, model used, validation notes |
| Weak area         | “Struggles with recursion and SQL joins”  |
| Career readiness  | “Backend junior path: 42% ready”          |

This turns the app into a career dashboard, not just a course app.

### 4. 2026 job-market adaptation

This is the future-looking layer.

Once a week or month, the app could update your plan based on:

* current job listings
* internship requirements
* Stack Overflow/GitHub/WEF-style trend data
* local Chicago or remote junior SWE requirements
* Python/TypeScript/SQL/AI demand
* portfolio gaps

But be careful: “future job predictions” can become fake-confidence garbage fast. Your app should separate:

**Hard evidence:** job postings, official surveys, real skill counts
**Soft signals:** blog posts, trend predictions, expert opinions
**Your goal:** SWE internship, junior backend, AI tooling, data/ML, etc.

That would align perfectly with your governance-first style.

## Should you include ML/AI?

Yes, but the path should be practical, not academic-first.

For 2026 career prep, I would split AI into three tracks:

### Track A: AI user/developer fluency

This is mandatory.

Teach:

* prompt writing
* tool calling
* code review with AI
* debugging with AI
* hallucination checking
* evals
* model comparison
* cost-aware model use
* security and prompt-injection basics

This is directly useful for SWE.

### Track B: AI app development

This is highly valuable.

Teach:

* OpenAI/Anthropic/Gemini APIs
* embeddings
* RAG basics
* vector search
* structured outputs
* agent workflows
* eval harnesses
* auth/billing/logging for AI apps

This fits your Babel/GPCGuard/Prismatix direction.

### Track C: ML fundamentals

Useful, but should come after Python/data basics.

Teach:

* pandas
* NumPy
* scikit-learn
* train/test split
* metrics
* overfitting
* classification/regression
* basic model deployment
* TensorFlow/PyTorch only after fundamentals

For your career path, **AI app engineering is probably more valuable than deep ML at first**.

## MVP I would build

Do not build the full app first. Build a tight MVP called something like:

**CareerForge Mobile**
or
**DevPath OS**
or
**Babel Career Lab**

### MVP features

1. **Skill map**

   * Python
   * JavaScript/TypeScript
   * SQL
   * Git
   * APIs
   * AI tooling
   * Projects

2. **Daily lesson cards**

   * 5–10 minute lessons
   * quiz
   * mini coding task
   * reflection/checkpoint

3. **Project missions**

   * each mission has requirements
   * starter prompt
   * test checklist
   * GitHub evidence field

4. **AI mentor**

   * explains mistakes
   * gives hints, not full answers
   * reviews project README
   * creates next-week plan

5. **Readiness score**

   * Junior SWE readiness
   * Python readiness
   * AI app dev readiness
   * Portfolio readiness

6. **Evidence log**

   * what you built
   * what passed
   * what needs work
   * links to GitHub/replit/local notes

That is enough for a strong personal tool and a strong portfolio project.

## What tech stack I’d use

Given your existing stack, I would use:

| Layer           | Recommendation                                                                 |
| --------------- | ------------------------------------------------------------------------------ |
| Mobile          | React Native / Expo                                                            |
| Backend         | Supabase                                                                       |
| Auth            | Supabase Auth                                                                  |
| DB              | Postgres                                                                       |
| AI layer        | OpenAI/Anthropic/Gemini/DeepInfra through your router                          |
| Content         | Markdown/MDX or JSON lesson packs                                              |
| Coding practice | Embedded editor for simple exercises, external Replit/GitHub for real projects |
| Analytics       | Supabase tables for attempts, mastery, streaks, evidence                       |
| Job data        | Start manual/imported; automate later                                          |

Do **not** build a full mobile code editor first. That is a trap. Use mobile for learning, planning, reviewing, and tracking. Use VS Code/Replit for serious coding.

## The key product difference

SoloLearn asks:

> “Did you complete the lesson?”

freeCodeCamp asks:

> “Did you complete the certification project?”

Your app should ask:

> “Can Jonathan prove he is becoming employable?”

That means your app should produce:

* weekly career report
* project gap report
* portfolio checklist
* GitHub-readiness score
* resume bullet suggestions
* mock interview questions
* AI-tooling proof
* skill evidence timeline

That is much more useful than another coding quiz app.

## Biggest risks

### Risk 1: Content bloat

Trying to write full courses will kill momentum.

Solution: start with **thin curriculum + strong projects**.

### Risk 2: Mobile coding limitations

Coding on mobile is annoying.

Solution: mobile app for pathing, review, planning, flashcards, evidence tracking; serious coding on desktop/Replit.

### Risk 3: Fake AI career advice

Future job predictions can be unreliable.

Solution: cite sources, track confidence, and separate “confirmed demand” from “trend speculation.”

### Risk 4: Overbuilding

You could spend 6 months building the app and not actually learning.

Solution: make the app force you to complete projects while building it. The app itself becomes your capstone.

## Best build strategy

I’d build it in phases.

### Phase 1: Personal tracker

Build a mobile app that tracks:

* skill areas
* current course/module
* daily tasks
* project missions
* GitHub links
* readiness score

No AI yet, no job scraping yet.

### Phase 2: Guided curriculum

Add curated paths:

* Python for SWE
* TypeScript for full-stack
* SQL/Postgres
* AI-assisted coding
* Practical AI apps
* Portfolio projects

### Phase 3: AI mentor

Add:

* hint mode
* code review mode
* README review
* project rubric grading
* weekly plan generation

### Phase 4: Job-market sync

Add job-skill analysis:

* paste job descriptions
* extract required skills
* compare against your skill graph
* generate gap plan
* update roadmap monthly

### Phase 5: Public portfolio mode

Generate:

* “skills evidence” page
* project summaries
* resume bullets
* GitHub checklist
* interview prep sheet

## Final answer

Yes, it is worth building — **but only if you build it as a personal AI-era career operating system, not as a SoloLearn/freeCodeCamp clone**.

The best version combines:

* SoloLearn’s mobile habit loop
* freeCodeCamp’s project/certification seriousness
* Replit/GitHub-style proof of work
* AI mentor guidance
* 2026 job-market skill tracking
* your own governance/evidence-first philosophy

For you personally, this is a **GREEN portfolio project** because it helps you learn while also proving you can design and ship a real product.

[1]: https://survey.stackoverflow.co/2025/?utm_source=chatgpt.com "2025 Stack Overflow Developer Survey"
[2]: https://www.weforum.org/stories/2025/01/future-of-jobs-report-2025-jobs-of-the-future-and-the-skills-you-need-to-get-them/?utm_source=chatgpt.com "Future of Jobs Report 2025: The jobs of the future"
[3]: https://www.weforum.org/stories/2026/01/software-developers-ai-work/?utm_source=chatgpt.com "Software developers are the vanguard of how AI is ..."
"

"Yes. Best path forward: **use Deep Research to produce the strategy/spec**, then use Codex `/goal` to turn that into a scoped implementation plan. Do **not** ask Codex to “research and build” in one step. Split it into stages so it does not hallucinate requirements or overbuild.

A key 2026 Android detail: for Google Play, new apps and updates currently need to target **Android 15 / API level 35 or higher**, except Android TV/Wear/Automotive variants with different requirements. Android’s official docs also distinguish APKs from Android App Bundles; an **AAB** is the Play publishing format, while an **APK** is useful for sideloading/testing. ([Android Developers][1]) Expo/EAS can build APKs for emulators/devices and ready-to-submit app binaries, while React Native’s official docs recommend using a framework/toolbox approach for production-ready apps. ([Expo Documentation][2])

## Best path forward

Use **two Deep Research prompts** and **one Codex `/goal` prompt**:

1. **Deep Research Prompt A:** market/career/curriculum research
2. **Deep Research Prompt B:** technical APK/AAB architecture research
3. **Codex `/goal` Prompt:** convert the research into a phased build plan for your repo

This avoids mixing “what should this app be?” with “how do we build it?”

---

# Prompt A — Deep Research: Product, career path, and curriculum

Use this first.

```text
You are a senior product strategist, mobile learning designer, SWE career coach, and technical researcher.

Research whether it is worth building a personal mobile app that combines the best parts of SoloLearn and freeCodeCamp into a specialized AI-era software engineering career-prep app.

Context:
- The app is primarily for personal use first, not a generic public education platform.
- The target user is an aspiring software engineer focused on Python, JavaScript/TypeScript, SQL, full-stack development, AI-assisted coding, practical ML/AI, Git/GitHub, and portfolio projects.
- The app should help the user become employable through evidence-based learning, not just quizzes or passive lessons.
- The desired outcome is a mobile APK/AAB app that can be built and tested on Android, with possible future store deployment.
- The app should eventually generate a structured plan that can be handed to Codex `/goal` for implementation.

Research requirements:
1. Compare SoloLearn and freeCodeCamp as of 2026:
   - mobile UX
   - course structure
   - Python curriculum
   - AI/ML curriculum
   - project-based learning
   - certificates/portfolio value
   - weaknesses/gaps
   - what features are worth copying conceptually
   - what should NOT be copied

2. Research 2026 software engineering job-market expectations:
   - junior SWE
   - Python developer
   - full-stack developer
   - AI app developer
   - data/ML entry-level roles
   - internship requirements
   - GitHub/portfolio expectations
   - AI tooling expectations
   - testing/debugging expectations
   - SQL/backend/API expectations

3. Identify the strongest learning paths for this app:
   - Python fundamentals
   - JavaScript/TypeScript
   - SQL/Postgres
   - Git/GitHub
   - APIs/auth/backend
   - testing/debugging
   - AI-assisted coding
   - practical AI app development
   - practical ML foundations
   - portfolio/capstone projects

4. Define a curriculum model:
   - modules
   - lessons
   - quizzes
   - coding tasks
   - projects
   - evidence requirements
   - readiness scoring
   - skill graph
   - review schedule
   - weekly career report

5. Define project missions:
   - beginner projects
   - intermediate projects
   - capstone projects
   - AI app projects
   - ML/data projects
   - portfolio-ready projects
   - GitHub evidence expectations

6. Research whether this is better as:
   - a mobile-first lesson app
   - a mobile dashboard plus desktop coding workflow
   - a React Native/Expo app
   - native Android/Kotlin app
   - PWA
   - hybrid approach

7. Produce a final product recommendation:
   - GREEN/YELLOW/RED verdict
   - target MVP
   - features to include
   - features to avoid
   - monetization potential, if any
   - personal career value
   - portfolio value
   - risks
   - mitigations

Source requirements:
- Use current 2025–2026 sources where possible.
- Prioritize official sources, developer surveys, labor/job data, credible curriculum pages, and official documentation.
- Cite every major factual claim.
- Separate facts from predictions.
- Mark uncertain claims clearly.
- Do not overclaim future job-market predictions.

Output format:
1. Executive summary
2. SoloLearn vs freeCodeCamp comparison table
3. 2026 job-market skill analysis
4. Recommended curriculum architecture
5. Recommended project ladder
6. MVP feature list
7. Features to avoid
8. Technical direction recommendation
9. Risks and mitigations
10. Final verdict
11. “Codex-ready product brief” section

The “Codex-ready product brief” must be concise and implementation-focused. It should include:
- app name placeholder
- target user
- problem statement
- MVP scope
- non-goals
- core screens
- data model concepts
- curriculum concepts
- evidence tracking concepts
- success criteria
```

---

# Prompt B — Deep Research: APK/AAB technical build requirements

Use this after Prompt A.

```text
You are a senior mobile architect, Android release engineer, React Native/Expo specialist, and security-minded SWE.

Research the technical requirements for building an Android APK/AAB for a personal AI-era software engineering career-prep app.

Context:
- The app will combine mobile learning, project missions, readiness tracking, AI-guided study planning, and evidence logging.
- The likely stack is React Native with Expo/EAS, but compare against native Android/Kotlin and PWA.
- The user works mostly on Windows and VS Code.
- Backend candidates include Supabase/Postgres and possibly an AI model router/API layer later.
- The first goal is a working Android APK for personal testing.
- Later goals may include AAB for Google Play, Amazon Appstore, or other Android distribution channels.
- The output should be suitable for feeding into Codex `/goal`.

Research requirements:
1. Compare implementation stacks:
   - React Native + Expo/EAS
   - React Native bare workflow
   - native Android/Kotlin
   - Flutter
   - PWA/TWA
   - recommend the best fit for this project

2. Research Android build requirements as of 2026:
   - APK vs AAB
   - debug APK vs release APK
   - signing keys
   - keystore handling
   - target SDK requirements
   - minimum SDK recommendations
   - Play Store requirements
   - sideloading/testing requirements
   - Android permissions
   - storage/privacy considerations
   - offline support considerations

3. Research Expo/EAS requirements:
   - project setup
   - eas.json build profiles
   - APK build profile
   - AAB build profile
   - environment variables
   - app signing
   - local vs cloud builds
   - limitations
   - CI/CD possibilities

4. Research app architecture:
   - offline-first local storage
   - Supabase sync
   - auth options
   - curriculum content format
   - local JSON/MDX lesson packs
   - progress tracking schema
   - skill graph schema
   - project evidence schema
   - AI mentor integration later
   - job description import later
   - privacy/security model

5. Define MVP screens:
   - onboarding
   - dashboard
   - learning path
   - lesson screen
   - quiz/checkpoint screen
   - project mission screen
   - evidence log
   - readiness score
   - weekly plan
   - settings

6. Define data model:
   - users
   - tracks
   - modules
   - lessons
   - exercises
   - quizzes
   - projects
   - attempts
   - evidence items
   - skills
   - readiness scores
   - weekly plans

7. Define implementation phases:
   - Phase 0: repo/app skeleton
   - Phase 1: local-only MVP
   - Phase 2: persistent progress
   - Phase 3: project missions/evidence log
   - Phase 4: Supabase sync/auth
   - Phase 5: AI mentor
   - Phase 6: APK/AAB release hardening

8. Define testing requirements:
   - unit tests
   - component tests
   - navigation tests
   - data validation tests
   - APK smoke test
   - Android emulator/manual testing
   - release checklist

9. Define security/privacy requirements:
   - no secrets in app bundle
   - secure API usage
   - environment variables
   - RLS if Supabase is used
   - user data minimization
   - offline data handling
   - privacy policy requirements if published

10. Produce a final technical recommendation:
   - stack choice
   - architecture
   - build path
   - release path
   - biggest technical risks
   - commands/checklists Codex should use

Source requirements:
- Use official docs where possible:
  - Android Developers
  - Google Play policy/docs
  - Expo/EAS docs
  - React Native docs
  - Supabase docs if used
- Cite every major factual claim.
- Clearly separate APK testing requirements from Play Store AAB publishing requirements.
- Do not assume outdated Android target SDK requirements.
- Verify all 2026 target SDK/build requirements from official sources.

Output format:
1. Executive summary
2. Recommended stack verdict
3. APK vs AAB explanation
4. 2026 Android requirements
5. Expo/EAS build plan
6. App architecture
7. Data model
8. MVP screens
9. Security/privacy model
10. Testing strategy
11. Release checklist
12. Risks and mitigations
13. “Codex-ready technical implementation brief”

The “Codex-ready technical implementation brief” must be concise and actionable. Include:
- recommended stack
- repo structure
- core dependencies
- build commands
- required config files
- environment variables
- data schema outline
- screen list
- implementation phases
- test commands
- APK/AAB acceptance criteria
```

---

# Prompt C — Codex `/goal`: turn research into an implementation plan

Use this after you have the two Deep Research reports.

```text
/goal

You are a senior mobile architect, product engineer, and release-focused SWE.

Goal:
Turn the attached Deep Research reports into a concrete implementation plan for building an Android APK/AAB MVP of my personal AI-era software engineering career-prep app.

Primary objective:
Create a phased, testable, implementation-ready plan for a mobile app that combines:
- SoloLearn-style mobile habit loops
- freeCodeCamp-style project/certification seriousness
- evidence-based skill tracking
- Python/TypeScript/SQL/AI learning paths
- project missions
- readiness scoring
- future AI mentor support
- future job-market skill gap tracking

Important:
Do not start coding yet unless explicitly instructed.
First inspect the repo/workspace if available, then produce a plan.
If there is no existing repo, recommend a clean repo structure.
Do not overbuild.
Do not create a full course platform.
Do not copy proprietary content from SoloLearn, freeCodeCamp, or any third-party platform.
Use only original placeholder curriculum content or clearly licensed/open content.

Inputs:
- Deep Research Report A: product, market, curriculum, career path
- Deep Research Report B: APK/AAB technical architecture and build requirements

Assumptions:
- Target platform: Android first
- Desired initial artifact: installable debug/release APK for personal testing
- Future artifact: AAB for Google Play or other store deployment
- Preferred stack: React Native + Expo/EAS unless research strongly argues otherwise
- Backend: local-first initially; Supabase later
- Development environment: Windows + VS Code
- User wants this as a personal learning and portfolio project

Tasks:
1. Summarize the product thesis:
   - what the app is
   - who it is for
   - why it should exist
   - what makes it different from SoloLearn/freeCodeCamp

2. Define the MVP:
   - must-have features
   - should-have features
   - later features
   - explicit non-goals

3. Define architecture:
   - frontend stack
   - navigation
   - state management
   - local storage
   - content format
   - data model
   - future Supabase sync
   - future AI mentor integration

4. Define screens:
   - onboarding
   - dashboard
   - learning path
   - lesson detail
   - quiz/checkpoint
   - project mission
   - evidence log
   - readiness score
   - weekly plan
   - settings

5. Define data contracts:
   - Track
   - Module
   - Lesson
   - Quiz
   - Exercise
   - ProjectMission
   - EvidenceItem
   - Skill
   - UserProgress
   - ReadinessScore
   - WeeklyPlan

6. Define implementation phases:
   Phase 0: repo/app setup
   Phase 1: navigation + static data
   Phase 2: local persistence
   Phase 3: lesson/checkpoint flow
   Phase 4: project missions + evidence logging
   Phase 5: readiness scoring
   Phase 6: APK build
   Phase 7: release hardening
   Phase 8: optional Supabase/AI/job-market extensions

7. For each phase, include:
   - goal
   - files likely to be created/changed
   - specific tasks
   - validation commands
   - acceptance criteria
   - rollback notes
   - risks

8. Define test strategy:
   - unit tests
   - schema/data validation
   - screen/component smoke tests
   - manual Android testing
   - APK install test
   - release checklist

9. Define build strategy:
   - debug APK
   - preview/release APK
   - future AAB
   - signing considerations
   - EAS build profiles
   - local vs cloud build considerations
   - no secrets in app bundle

10. Define content strategy:
   - original curriculum only
   - placeholder seed modules
   - no third-party content copying
   - first learning tracks:
     - Python Fundamentals
     - TypeScript/Web Fundamentals
     - SQL/Postgres
     - Git/GitHub
     - AI-Assisted Coding
     - Practical AI Apps
     - ML Foundations
   - first 5 project missions

11. Produce final output as:
   - Product brief
   - Technical brief
   - Phased implementation plan
   - Acceptance criteria
   - Test plan
   - APK/AAB build checklist
   - Risk register
   - Recommended first coding task

Hard constraints:
- Evidence-first planning.
- Do not claim completion without commands/tests.
- Prefer small, reversible changes.
- Avoid premature backend/AI complexity.
- Build local-first first.
- Do not add paid APIs until core offline MVP works.
- Do not store secrets in the app.
- Do not use copied course content.
- Do not implement job scraping in MVP.
- End with a clear RED/YELLOW/GREEN readiness verdict for starting implementation.

Output style:
Use a structured engineering plan with headings, tables, checklists, and phase gates.
```

---

# Optional Prompt D — Codex coding prompt for Phase 0 only

After Codex produces the plan, use a small Phase 0 prompt instead of asking it to build everything.

```text
/goal

Implement Phase 0 only for the Android career-prep mobile app.

Scope:
- Create or inspect the React Native/Expo project structure.
- Add TypeScript if not already enabled.
- Add basic navigation.
- Add placeholder screens only.
- Add a simple local seed data file for tracks/modules.
- Add basic validation for seed data.
- Add test/build commands.
- Do not implement Supabase.
- Do not implement AI mentor.
- Do not implement job-market sync.
- Do not add copied course content.
- Do not overbuild.

Expected screens:
- Dashboard
- Learning Path
- Lesson Detail
- Project Missions
- Evidence Log
- Readiness Score
- Settings

Expected outputs:
1. Files changed
2. Commands run
3. Test/build results
4. Known gaps
5. Next recommended phase
6. RED/YELLOW/GREEN verdict

Acceptance criteria:
- App boots locally.
- Navigation works between placeholder screens.
- TypeScript check passes.
- Seed data validation passes.
- No secrets are introduced.
- No proprietary course content is copied.
- Project is ready for Phase 1.
```

---

## My implementation recommendation

Use this order:

**Deep Research A → Deep Research B → Codex `/goal` plan → Codex Phase 0 only → Phase-by-phase builds**

For the app itself, I would start **React Native + Expo + TypeScript + local JSON curriculum + local progress storage**. Add Supabase and AI later. Your first win should be a working Android APK that shows the dashboard, tracks, missions, evidence log, and readiness score with local data.

[1]: https://developer.android.com/google/play/requirements/target-sdk?utm_source=chatgpt.com "Meet Google Play's target API level requirement"
[2]: https://docs.expo.dev/build-reference/apk/?utm_source=chatgpt.com "Build APKs for Android Emulators and devices"
"