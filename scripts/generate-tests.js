/**
 * Test Generator Script
 * 
 * This script automatically generates test files for all backend API routes and frontend components
 * that don't have tests yet.
 */

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

// Paths
const BACKEND_SRC_DIR = path.join(__dirname, '..', 'backend');
const FRONTEND_SRC_DIR = path.join(__dirname, '..', 'frontend', 'src');
const BACKEND_TEST_DIR = path.join(BACKEND_SRC_DIR, 'tests');
const FRONTEND_TEST_DIR = path.join(FRONTEND_SRC_DIR, 'tests');
const API_TEMPLATE_PATH = path.join(__dirname, 'test-templates', 'api-test-template.js');
const COMPONENT_TEMPLATE_PATH = path.join(__dirname, 'test-templates', 'react-component-test-template.js');

// Ensure test directories exist
fs.ensureDirSync(BACKEND_TEST_DIR);
fs.ensureDirSync(FRONTEND_TEST_DIR);
fs.ensureDirSync(path.join(FRONTEND_TEST_DIR, 'components'));
fs.ensureDirSync(path.join(FRONTEND_TEST_DIR, 'pages'));
fs.ensureDirSync(path.join(FRONTEND_TEST_DIR, 'context'));

// Read template files
const apiTemplate = fs.readFileSync(API_TEMPLATE_PATH, 'utf8');
const componentTemplate = fs.readFileSync(COMPONENT_TEMPLATE_PATH, 'utf8');

// Generate backend API tests
function generateBackendTests() {
  console.log('Generating backend API tests...');
  
  // Find all route files
  const routeFiles = glob.sync(path.join(BACKEND_SRC_DIR, 'routes', '*.js'));
  
  routeFiles.forEach(routeFile => {
    const routeFileName = path.basename(routeFile, '.js');
    const testFilePath = path.join(BACKEND_TEST_DIR, `${routeFileName}.test.js`);
    
    // Skip if test file already exists
    if (fs.existsSync(testFilePath)) {
      console.log(`Test already exists for ${routeFileName} route`);
      return;
    }
    
    console.log(`Generating test for ${routeFileName} route...`);
    
    // Determine model file that likely corresponds to the route
    let modelName = routeFileName.endsWith('s') ? 
      routeFileName.substring(0, routeFileName.length - 1) : 
      routeFileName;
    
    // Capitalize first letter for model name
    modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    
    // Create test content
    let testContent = apiTemplate
      .replace(/ROUTE_FILE/g, `../routes/${routeFileName}`)
      .replace(/MODEL_FILE/g, `../models/${modelName}`)
      .replace(/ENDPOINT_PREFIX/g, `/api/${routeFileName}`)
      .replace(/ENDPOINT_PATH/g, '')
      .replace(/ROUTE_NAME/g, modelName)
      .replace(/ROLE/g, routeFileName === 'projects' || routeFileName === 'tasks' ? 'project_manager' : 'developer');
    
    // Write test file
    fs.writeFileSync(testFilePath, testContent);
    console.log(`Created ${testFilePath}`);
  });
}

// Generate frontend component tests
function generateFrontendTests() {
  console.log('Generating frontend component tests...');
  
  // Find all component files
  const componentFiles = glob.sync(path.join(FRONTEND_SRC_DIR, 'components', '*.js'));
  const pageFiles = glob.sync(path.join(FRONTEND_SRC_DIR, 'pages', '*.js'));
  const contextFiles = glob.sync(path.join(FRONTEND_SRC_DIR, 'context', '*.js'));
  
  // Process components
  componentFiles.forEach(componentFile => {
    generateFrontendComponentTest(componentFile, 'components');
  });
  
  // Process pages
  pageFiles.forEach(pageFile => {
    generateFrontendComponentTest(pageFile, 'pages');
  });
  
  // Process contexts
  contextFiles.forEach(contextFile => {
    const contextFileName = path.basename(contextFile, '.js');
    // Skip index.js and non-context files
    if (contextFileName === 'index' || !contextFileName.includes('Context')) {
      return;
    }
    generateFrontendComponentTest(contextFile, 'context');
  });
}

function generateFrontendComponentTest(componentFile, type) {
  const componentFileName = path.basename(componentFile, '.js');
  const testFilePath = path.join(FRONTEND_TEST_DIR, type, `${componentFileName}.test.js`);
  
  // Skip if test file already exists or if it's an index file
  if (fs.existsSync(testFilePath) || componentFileName === 'index') {
    console.log(`Test already exists for ${componentFileName} ${type.slice(0, -1)}`);
    return;
  }
  
  console.log(`Generating test for ${componentFileName} ${type.slice(0, -1)}...`);
  
  // Get relative path from test file to component
  const relativePath = path.relative(
    path.join(FRONTEND_TEST_DIR, type),
    componentFile
  ).replace(/\\/g, '/');
  
  // Create test content
  let testContent = componentTemplate
    .replace(/COMPONENT_PATH/g, `../../${relativePath.replace('.js', '')}`)
    .replace(/COMPONENT_NAME/g, componentFileName);
  
  // Write test file
  fs.writeFileSync(testFilePath, testContent);
  console.log(`Created ${testFilePath}`);
}

// Main function
function main() {
  console.log('Starting test generation...');
  
  // Generate backend tests
  generateBackendTests();
  
  // Generate frontend tests
  generateFrontendTests();
  
  console.log('Test generation complete!');
}

// Run the script
main(); 