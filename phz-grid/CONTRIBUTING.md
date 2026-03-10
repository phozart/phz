# Contributing to phz-grid

Thank you for your interest in contributing to phz-grid!

## Development Setup

```bash
git clone https://github.com/phozart/phz-grid.git
cd phz-grid
npm install
npm test
```

## Project Structure

This is a monorepo with packages in `packages/`. See [CLAUDE.md](./CLAUDE.md) for full architecture documentation.

## Making Changes

1. Fork the repository and create a feature branch from `main`
2. Write tests for your changes — we use Vitest
3. Ensure all tests pass: `npm test`
4. Ensure TypeScript compiles: `npm run typecheck`
5. Submit a pull request

## Code Conventions

- TypeScript strict mode
- ESM-only (no CommonJS)
- Lit decorators for Web Components
- Vitest for unit/integration tests
- Prettier for formatting

## Accessibility

Accessibility is a core requirement. Every feature must work with:
- Screen readers
- Keyboard navigation
- Forced Colors Mode
- Motor impairment accommodations

Never submit a feature without accessibility support.

## Reporting Issues

Please use [GitHub Issues](https://github.com/phozart/phz-grid/issues) to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
