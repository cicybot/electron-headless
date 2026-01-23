const fs = require('fs');

// Read the test file
let content = fs.readFileSync('tests/prompt-area.test.js', 'utf8');

// Find the section where window._G is defined and add the handleElectronRender mock
const oldSection = `        // Mock the global window._G object if needed
        window._G = {
            showPromptArea: require('../src/utils-browser.js').showPromptArea,
            hidePromptArea: require('../src/utils-browser.js').hidePromptArea
        };`;

const newSection = `        // Mock the global window._G object and handleElectronRender function
        window._G = {
            showPromptArea: require('../src/utils-browser.js').showPromptArea,
            hidePromptArea: require('../src/utils-browser.js').hidePromptArea
        };
        
        // Mock the window.handleElectronRender function
        window.handleElectronRender = jest.fn((textarea) => {
            // Mock the behavior: clear textarea value
            textarea.value = '';
        });`;

const updatedContent = content.replace(oldSection, newSection);

// Write back to file
fs.writeFileSync('tests/prompt-area.test.js', updatedContent);

console.log('Updated test file with handleElectronRender mock');
