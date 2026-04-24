/**
 * VALIDATION DEMO RUNNER
 * =====================
 * Run this script to test profile validation
 * Usage: npx tsx run-validation-demo.ts
 */

import { runProfileValidation, generateDemoCalculatedResults, type BatchValidationResult } from './profile-validation';
import { STANDARD_PROFILES_REFERENCE } from './reference-data/standard-profiles-reference';

// ============================================
// ANSI COLORS FOR TERMINAL
// ============================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// ============================================
// MAIN DEMO FUNCTION
// ============================================

async function runDemo(): Promise<void> {
  console.log(`
${colors.cyan}${colors.bold}╔══════════════════════════════════════════════════════════════════════╗
║     SAI ROLOTECH SMART ENGINES - PROFILE VALIDATION DEMO            ║
║     Roll Forming Accuracy Testing v2.3.0                             ║
╚══════════════════════════════════════════════════════════════════════╝${colors.reset}
  `);

  console.log(`${colors.blue}Loading 10 standard profiles...${colors.reset}`);
  console.log(`Total profiles: ${STANDARD_PROFILES_REFERENCE.length}\n`);

  // Display profiles
  console.log(`${colors.bold}Profile List:${colors.reset}`);
  for (const profile of STANDARD_PROFILES_REFERENCE) {
    const difficultyColor = profile.difficulty === 'Easy' ? colors.green :
                           profile.difficulty === 'Medium' ? colors.yellow : colors.red;
    console.log(`  ${colors.cyan}[${profile.id}]${colors.reset} ${profile.name} - ${difficultyColor}${profile.difficulty}${colors.reset}`);
    console.log(`       Category: ${profile.category}`);
    console.log(`       Material: ${profile.material.grade} (${profile.material.type})`);
    console.log(`       Strip Width: ${profile.expectedValues.stripWidth}mm`);
    console.log(`       Stations: ${profile.expectedValues.stationCount}`);
    console.log('');
  }

  console.log(`${colors.blue}Generating simulated calculated results...${colors.reset}\n`);

  // Generate demo calculated results
  const calculatedResults = generateDemoCalculatedResults();

  console.log(`${colors.blue}Running validation...${colors.reset}\n`);

  // Run validation
  const results = await runProfileValidation(calculatedResults);

  // Display results
  displayResults(results);

  // Save results to file
  saveResults(results);
}

// ============================================
// DISPLAY RESULTS
// ============================================

function displayResults(results: BatchValidationResult): void {
  console.log(`
${colors.bold}═══════════════════════════════════════════════════════════════════════${colors.reset}
${colors.bold}                         VALIDATION RESULTS${colors.reset}
${colors.bold}═══════════════════════════════════════════════════════════════════════${colors.reset}
  `);

  // Summary
  console.log(`${colors.cyan}${colors.bold}SUMMARY:${colors.reset}`);
  console.log(`  Total Profiles: ${results.totalProfiles}`);
  console.log(`  ${results.passed >= 8 ? colors.green : results.passed >= 5 ? colors.yellow : colors.red}${colors.bold}Passed: ${results.passed}${colors.reset}`);
  console.log(`  ${results.failed > 5 ? colors.red : colors.yellow}${colors.bold}Failed: ${results.failed}${colors.reset}`);
  console.log(`  ${colors.cyan}${colors.bold}Overall Accuracy: ${results.accuracyScore}%${colors.reset}`);

  // Individual results
  console.log(`
${colors.bold}INDIVIDUAL PROFILE RESULTS:${colors.reset}
`);

  for (const result of results.results) {
    const profile = STANDARD_PROFILES_REFERENCE.find(p => p.id === result.profileId);
    const statusColor = result.passed ? colors.green : colors.red;
    const statusIcon = result.passed ? '✓' : '✗';

    console.log(`${statusColor}${colors.bold}[${statusIcon}] ${result.profileName}${colors.reset}`);

    if (!result.passed) {
      console.log(`    ${colors.red}FAILED - Accuracy: ${result.accuracy}%${colors.reset}`);
      for (const error of result.errors) {
        console.log(`    ${colors.yellow}⚠ ${error}${colors.reset}`);
      }
    } else {
      console.log(`    ${colors.green}PASSED - Accuracy: ${result.accuracy}%${colors.reset}`);
    }

    // Show key metrics
    const stripWidth = result.metrics.find(m => m.metric === 'Strip Width');
    const stationCount = result.metrics.find(m => m.metric === 'Station Count');
    const springback = result.metrics.find(m => m.metric === 'Springback Factor');

    console.log(`    Strip Width: ${stripWidth?.actual}mm (Expected: ${stripWidth?.expected}mm) ${stripWidth?.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
    console.log(`    Stations: ${stationCount?.actual} (Expected: ${stationCount?.expected}) ${stationCount?.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
    console.log(`    Springback: ${springback?.actual?.toFixed(3)} (Expected: ${springback?.expected?.toFixed(3)}) ${springback?.passed ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
    console.log('');
  }

  // Accuracy breakdown
  console.log(`${colors.bold}ACCURACY BREAKDOWN:${colors.reset}`);
  console.log(`  Strip Width:    ${results.summary.stripWidthAccuracy}%`);
  console.log(`  Station Count:  ${results.summary.stationCountAccuracy}%`);
  console.log(`  Springback:      ${results.summary.springbackAccuracy}%`);
  console.log(`  G-Code:         ${results.summary.gcodeAccuracy}%`);
  console.log(`  Overall Pass:    ${results.summary.overallPassRate}%`);

  if (results.summary.criticalFailures.length > 0) {
    console.log(`
${colors.red}${colors.bold}CRITICAL FAILURES:${colors.reset}`);
    for (const id of results.summary.criticalFailures) {
      console.log(`  ${colors.red}✗ ${id}${colors.reset}`);
    }
  }

  // Final verdict
  const passRate = (results.passed / results.totalProfiles) * 100;
  console.log(`
${colors.bold}═══════════════════════════════════════════════════════════════════════${colors.reset}
`);

  if (passRate >= 90) {
    console.log(`${colors.green}${colors.bold}🎉 EXCELLENT! ${passRate.toFixed(0)}% profiles passed!${colors.reset}`);
    console.log(`${colors.green}Software accuracy is within acceptable industrial standards.${colors.reset}`);
  } else if (passRate >= 70) {
    console.log(`${colors.yellow}${colors.bold}⚠️  GOOD - ${passRate.toFixed(0)}% profiles passed${colors.reset}`);
    console.log(`${colors.yellow}Most profiles are accurate. Review failed profiles for improvements.${colors.reset}`);
  } else if (passRate >= 50) {
    console.log(`${colors.yellow}${colors.bold}⚠️  NEEDS IMPROVEMENT - ${passRate.toFixed(0)}% profiles passed${colors.reset}`);
    console.log(`${colors.yellow}Significant accuracy issues detected. Review algorithms.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ POOR - Only ${passRate.toFixed(0)}% profiles passed${colors.reset}`);
    console.log(`${colors.red}Major accuracy issues. Algorithm review required.${colors.reset}`);
  }

  console.log(`
${colors.bold}═══════════════════════════════════════════════════════════════════════${colors.reset}
`);
}

// ============================================
// SAVE RESULTS
// ============================================

function saveResults(results: BatchValidationResult): void {
  const fs = require('fs');
  const path = require('path');

  const outputDir = path.join(__dirname, 'results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(outputDir, `validation-results-${timestamp}.json`);

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`
${colors.green}Results saved to: ${outputPath}${colors.reset}
  `);
}

// ============================================
// RUN
// ============================================

runDemo().catch(console.error);
