const fs = require('fs');

// Read the test file
let content = fs.readFileSync('tests/prompt-area.test.js', 'utf8');

// Replace the position display test with a simpler version
const oldTest = `    it('should display position and size in header', () => {
        window._G.showPromptArea();
        
        const promptDiv = document.getElementById('__promptDiv');
        const positionDisplay = promptDiv.querySelector('div[style*="position: absolute"]');
        
        expect(positionDisplay).toBeTruthy();
        expect(positionDisplay.textContent).toMatch(/Pos: \\d+,\\d+ \\| Size: \\d+×\\d+/);
        
        // Test initial position and size
        const initialText = positionDisplay.textContent;
        expect(initialText).toContain('Pos: 50,50');
        expect(initialText).toContain('Size: 600×200');
    });`;

const newTest = `    it('should display position and size in header', () => {
        window._G.showPromptArea();
        
        const promptDiv = document.getElementById('__promptDiv');
        // Find by checking all divs for monospace font (position display uses monospace)
        const allDivs = promptDiv.querySelectorAll('div');
        let positionDisplay = null;
        
        for (let div of allDivs) {
            if (div.style && div.style.fontFamily === 'monospace') {
                positionDisplay = div;
                break;
            }
        }
        
        expect(positionDisplay).toBeTruthy();
        expect(positionDisplay.textContent).toMatch(/Pos: \\d+,\\d+ \\| Size: \\d+×\\d+/);
        
        // Test initial position and size
        const initialText = positionDisplay.textContent;
        expect(initialText).toContain('Pos: 50,50');
        expect(initialText).toContain('Size: 600×200');
    });`;

content = content.replace(oldTest, newTest);

// Write back to file
fs.writeFileSync('tests/prompt-area.test.js', content);

console.log('Fixed position display test');
