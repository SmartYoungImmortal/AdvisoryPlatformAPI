const fs = require('node:fs');
const path = require('node:path');
const { createCoverageMap } = require('istanbul-lib-coverage');
const { createContext } = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const coverageDirectory = path.resolve('coverage');
const suites = ['unit', 'integration', 'e2e'];
const coverageMap = createCoverageMap({});

for (const suite of suites) {
  const reportPath = path.join(
    coverageDirectory,
    suite,
    'coverage-final.json',
  );
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Missing ${suite} coverage report: ${reportPath}`);
  }
  coverageMap.merge(JSON.parse(fs.readFileSync(reportPath, 'utf8')));
}

// Coverage measures executable behavior. Declarative schema/DTO/module/constant files are
// exercised indirectly by boot and migration tests but do not provide meaningful branch targets.
const excludedProductionFiles = [
  /[\\/]database[\\/]schema[\\/]/,
  /[\\/]dtos[\\/]/,
  /\.module\.ts$/,
  /\.constants\.ts$/,
  /[\\/]main\.ts$/,
];
coverageMap.filter(
  (file) =>
    !excludedProductionFiles.some((pattern) => pattern.test(file)),
);

fs.writeFileSync(
  path.join(coverageDirectory, 'coverage-final.json'),
  JSON.stringify(coverageMap),
);

const context = createContext({ dir: coverageDirectory, coverageMap });
for (const reporter of ['text', 'json-summary', 'lcov', 'html']) {
  reports.create(reporter).execute(context);
}

const threshold = 80;
const summary = coverageMap.getCoverageSummary().toJSON();
const failedMetrics = ['statements', 'branches', 'functions', 'lines'].filter(
  (metric) => summary[metric].pct < threshold,
);

if (failedMetrics.length > 0) {
  const actual = failedMetrics
    .map((metric) => `${metric}=${summary[metric].pct}%`)
    .join(', ');
  throw new Error(`Aggregate coverage must be >= ${threshold}%: ${actual}`);
}
