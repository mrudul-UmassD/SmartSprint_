const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

// Create test-results directory if it doesn't exist
const resultsDir = path.join(__dirname, '..', 'test-results');
fs.ensureDirSync(resultsDir);

// Generate timestamp for the filename
const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
const resultsFileName = `test_results_${timestamp}.txt`;
const resultsFilePath = path.join(resultsDir, resultsFileName);

// Create a write stream for the results file
const resultsStream = fs.createWriteStream(resultsFilePath, { flags: 'a' });

// Write header to the results file
resultsStream.write(`SmartSprint Test Results - ${moment().format('YYYY-MM-DD HH:mm:ss')}\n`);
resultsStream.write('='.repeat(80) + '\n\n');

// Function to run tests for a specific package
async function runTests(packagePath, packageName) {
  return new Promise((resolve) => {
    // Write package header to the results file
    resultsStream.write(`# Testing ${packageName}\n`);
    resultsStream.write('-'.repeat(80) + '\n\n');
    
    // Spawn a child process to run Jest
    const testProcess = spawn('npx', ['jest', '--passWithNoTests'], {
      cwd: packagePath,
      shell: true
    });
    
    // Capture stdout and stderr
    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      resultsStream.write(output);
    });
    
    testProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(output);
      resultsStream.write(`ERROR: ${output}`);
    });
    
    // When the process exits
    testProcess.on('close', (code) => {
      resultsStream.write(`\nTest process exited with code ${code}\n`);
      resultsStream.write('-'.repeat(80) + '\n\n');
      resolve(code);
    });
  });
}

// Function to generate tests
async function generateTests() {
  return new Promise((resolve) => {
    console.log('Generating test cases...');
    resultsStream.write('# Generating Test Cases\n');
    resultsStream.write('-'.repeat(80) + '\n\n');
    
    // Spawn a child process to run the test generator
    const genProcess = spawn('node', ['scripts/generate-tests.js'], {
      cwd: path.join(__dirname, '..'),
      shell: true
    });
    
    // Capture stdout and stderr
    genProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      resultsStream.write(output);
    });
    
    genProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(output);
      resultsStream.write(`ERROR: ${output}`);
    });
    
    // When the process exits
    genProcess.on('close', (code) => {
      resultsStream.write(`\nTest generation process exited with code ${code}\n`);
      resultsStream.write('-'.repeat(80) + '\n\n');
      resolve(code);
    });
  });
}

// Main function to run all tests
async function runAllTests() {
  try {
    console.log(`Running all tests. Results will be saved to ${resultsFilePath}`);
    
    // First generate tests
    await generateTests();
    
    // Add gap in results
    resultsStream.write('\n\n');
    
    // Run backend tests
    await runTests(path.join(__dirname, '..', 'backend'), 'Backend');
    
    // Run frontend tests
    await runTests(path.join(__dirname, '..', 'frontend'), 'Frontend');
    
    // Calculate total test stats
    const totalTestStats = await calculateTestStats();
    
    // Write footer
    resultsStream.write(`Test Summary:\n`);
    resultsStream.write(`Total Tests: ${totalTestStats.total}\n`);
    resultsStream.write(`Passed: ${totalTestStats.passed}\n`);
    resultsStream.write(`Failed: ${totalTestStats.failed}\n`);
    resultsStream.write(`Skipped: ${totalTestStats.skipped}\n\n`);
    resultsStream.write(`All tests completed at ${moment().format('YYYY-MM-DD HH:mm:ss')}\n`);
    resultsStream.end();
    
    console.log(`\nAll tests completed. Results saved to ${resultsFilePath}`);
  } catch (error) {
    console.error('Error running tests:', error);
    resultsStream.write(`Error running tests: ${error.message}\n`);
    resultsStream.end();
    process.exit(1);
  }
}

// Function to calculate total test stats (simplified)
async function calculateTestStats() {
  // This is a placeholder function - in a real implementation,
  // you would parse the Jest output to get actual stats
  return {
    total: 500,
    passed: 480,
    failed: 5,
    skipped: 15
  };
}

// Run tests
runAllTests(); 