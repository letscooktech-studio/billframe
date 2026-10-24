/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/tests/mocks/react-native.ts',
    '^expo-sqlite$': '<rootDir>/tests/mocks/expo-sqlite.ts',
    '^expo-print$': '<rootDir>/tests/mocks/expo-print.ts',
    '^expo-sharing$': '<rootDir>/tests/mocks/expo-sharing.ts',
    '^expo-crypto$': '<rootDir>/tests/mocks/expo-crypto.ts',
    '^expo-file-system$': '<rootDir>/tests/mocks/expo-file-system.ts',
    '^expo-secure-store$': '<rootDir>/tests/mocks/expo-secure-store.ts',
    '^lucide-react-native$': '<rootDir>/tests/mocks/lucide-react-native.ts',
    '^expo-router$': '<rootDir>/tests/mocks/expo-router.ts',
    '^react-native-safe-area-context$': '<rootDir>/tests/mocks/react-native-safe-area-context.ts',
    '^react-native-svg$': '<rootDir>/tests/mocks/react-native-svg.ts',
  },
};
