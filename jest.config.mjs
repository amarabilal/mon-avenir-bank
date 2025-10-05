/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.base.json', isolatedModules: true }]
  },
  roots: ['<rootDir>'],
  moduleFileExtensions: ['js','mjs','ts','tsx','json']
};
