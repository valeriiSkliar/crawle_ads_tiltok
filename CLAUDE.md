# CLAUDE.md - TikTok Ads Crawler

## Build/Test/Lint Commands
- Build: `npm run build`
- Start dev mode: `npm run start:dev`
- Run tests: `npm test` (Vitest)
- Run tests in watch mode: `npm run test:watch`
- Run tests with UI: `npm run test:ui`
- Run tests with coverage: `npm run test:coverage`
- Run specific test file: `npx vitest run path/to/file.vitest.ts`
- Run legacy Jest tests: `npm run test:jest`
- Test Gemini API: `npm run test:gemini`
- Lint: `npx eslint src/**/*.ts`

## Code Style Guidelines
- **TypeScript**: Use TypeScript for type safety, following ES2022 standards
- **Imports**: Use path aliases (@lib/*, @src/*, @helpers/*) defined in tsconfig.json
- **OOP Structure**: Follow class-based architecture per refactoring plan
- **Error Handling**: Use try/catch blocks with proper logging
- **Naming**: camelCase for variables/methods, PascalCase for classes/interfaces
- **Testing**: Vitest for testing TypeScript code (use .vitest.ts extension for new test files)
- **Documentation**: Use JSDoc comments for classes and methods
- **Environment**: Use @t3-oss/env-core with zod for config validation

Code should follow the OOP refactoring plan with clear separation of concerns between crawler components.