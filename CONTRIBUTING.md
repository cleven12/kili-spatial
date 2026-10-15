# Contributing

Thanks for helping improve KiliSpatial! Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

1. Fork and clone, then `pnpm install` (Node 22.17+).
2. Create a branch from `main`.
3. Make your change. Keep Svelte 5 runes syntax and match the surrounding code style.
4. Run `pnpm check` and `pnpm build`; both must pass with no errors or warnings.
5. Commit with [Conventional Commits](https://www.conventionalcommits.org/) (`feat(map): ...`, `fix(ui): ...`), one feature or fix per commit.
6. Open a pull request describing what changed and, for UI work, include a screenshot.

## Ideas that need help

- GPX-accurate trail geometry for Marangu and other routes
- Route JSON schema, loader and embed mode (see the README roadmap)
- Accessibility improvements for the map and chart
- Translations

## Reporting issues

Please include browser, device/GPU, and console output. Map rendering bugs are often WebGL-related.
