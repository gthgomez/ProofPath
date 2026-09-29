# Security Policy — ProofPath

## Project status: proprietary, not open source

ProofPath is proprietary software. The source is published for source visibility and transparency only. The repository [LICENSE](LICENSE) is a proprietary license notice that grants no permission to copy, modify, redistribute, or build derivative works. The [README](README.md) states this in its opening banner.

Because no permission to use the code has been granted, a defect in it is not a "vulnerability" in the open-source sense. It is a question about unauthorized use of unlicensed software, and that question belongs to the owner of the code, not to a public disclosure process. This file exists so the boundary is stated plainly instead of left to inference.

## What this repository does not offer

- **No security support.** The maintainer does not triage, investigate, or remediate security reports for ProofPath.
- **No coordinated disclosure program.** There is no embargo, no safe harbor, and no private disclosure window.
- **No bug bounty.** No reward is offered.
- **No response-time commitment.** There is no SLA and no support window.
- **No supported versions.** No release is a supported security-fix channel.

## What this project has documented about itself

These are the repository's own records, not promises of security support. They are cited so a reader can verify claims rather than take them on faith.

- [PRIVACY.md](PRIVACY.md) — local-only data model: no accounts, no progress sync, on-device SQLite storage, and a Code Lab sandbox enforced with `allowNetwork: false` so user-written lesson code cannot open outbound network connections.
- [QA_CHECKLIST.md](QA_CHECKLIST.md) and [STATUS.md](STATUS.md) — the project's own verification and status record.
- [docs/sandbox-audit-2026-05-07.md](docs/sandbox-audit-2026-05-07.md), [docs/sandbox-runtime-limits.md](docs/sandbox-runtime-limits.md), and [docs/sandbox-qa-baseline.md](docs/sandbox-qa-baseline.md) — audits of the in-app code execution sandbox, including its documented limits.

These documents describe controls observed at a point in time. They are not a guarantee that no defect exists.

## Reporting a genuine concern

If you believe you have found a genuine security concern, the honest position is that the maintainer has not accepted a support obligation, so there is no guaranteed response. If you choose to raise it anyway:

- Prefer GitHub's private vulnerability reporting for this repository (the **Security** tab → **Report a vulnerability**), if it is available to you.
- Otherwise contact the repository owner through their public profile at <https://github.com/gthgomez>.
- Do not open a public issue, and do not include working exploit code, credentials, or third-party personal data in a public report.
- You receive no service commitment, no bounty, and no assurance of a fix.

## Visibility is not permission

The repository being public creates no support obligation. Publishing source does not grant a license, does not create a support contract, and does not make the maintainer a vendor to you. Opening an issue or submitting a pull request grants you no rights and creates no partnership; contributions are not accepted for reuse, and no license is granted over anything you send here.

## Third-party dependencies

Third-party components remain under their own licenses and their own security policies. Issues in a dependency should be reported to that project, not here. This document does not extend to them.
