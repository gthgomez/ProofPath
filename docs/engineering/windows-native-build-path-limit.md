# Windows native build path limit

Android Gradle builds of this repo require a short checkout path on Windows.

CMake compiles the native libraries with absolute source paths embedded in
object filenames and ninja response files. Windows limits most file paths to
260 characters (`MAX_PATH`), so a checkout under a long directory chain — for
example a deeply nested agent worktree — fails CMake/ninja with errors that
look like missing files or dangling commands, not like path-length problems.

**Rule:** keep ProofPath checkouts and task worktrees at roughly 40 characters
of absolute path or less (for example `D:\AgentData\worktrees\ProofPath\p1ev`).
If a build fails with cascading CMake/ninja errors after a clone or a move,
clear `android/app/.cxx` and `android/app/build` before rebuilding so stale
absolute paths do not survive the relocation.

First observed 2026-10-11 while assembling `:app:assembleDebug` and
`:app:assembleStandalone` (`-PreactNativeArchitectures=x86_64`) in a long-path
worktree.
