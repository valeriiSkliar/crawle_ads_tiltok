# CLAUDE.md - TikTok Ads Crawler

## Build/Test/Lint Commands
- Build: `npm run build`
- Start dev mode: `npm run start:dev`
- Run tests: `npm test`
- Run single test: `npm test -- -t "test name pattern"`
- Test Gemini API: `npm run test:gemini`
- Lint: `npx eslint src/**/*.ts`

## Code Style Guidelines
- **TypeScript**: Use TypeScript for type safety, following ES2022 standards
- **Imports**: Use path aliases (@core/*, @services/*, etc.) defined in tsconfig.json
- **OOP Structure**: Follow class-based architecture per `.windsurfrules` refactoring plan
- **Error Handling**: Use try/catch blocks with proper logging
- **Naming**: camelCase for variables/methods, PascalCase for classes/interfaces
- **Testing**: Jest with ts-jest for testing TypeScript code
- **Documentation**: Use JSDoc comments for classes and methods
- **Environment**: Use @t3-oss/env-core with zod for config validation

Code should follow the OOP refactoring plan with clear separation of concerns between crawler components.