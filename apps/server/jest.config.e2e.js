module.exports = {
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/$1'
  },
  maxWorkers: '49%',
  moduleFileExtensions: ['js', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.e2e\\.test\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  testEnvironment: 'node',
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'coverage', outputName: 'junit.e2e.xml' }]
  ]
};
