const fs = require('fs');

// Read the test file
let content = fs.readFileSync('tests/prompt-area.test.js', 'utf8');

// Replace the alert-based test with handleElectronRender-based test
const oldTest = `    it('should handle enter key to alert value and clear', () => {
        const mockAlert = jest.fn();
        global.alert = mockAlert;
        
        window._G.showPromptArea();
        
        const promptDiv = document.getElementById('__promptDiv');
        const textarea = promptDiv.querySelector('textarea');
        
        // Set some text
        textarea.value = 'test message';
        
        // Simulate Enter key press (without shift)
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            shiftKey: false
        });
        
        textarea.dispatchEvent(enterEvent);
        
        // Check that alert was called with the value
        expect(mockAlert).toHaveBeenCalledWith('test message');
        
        // Check that textarea was cleared
        expect(textarea.value).toBe('');
    });`;

const newTest = `    it('should handle enter key to call handleElectronRender and clear', () => {
        window._G.showPromptArea();
        
        const promptDiv = document.getElementById('__promptDiv');
        const textarea = promptDiv.querySelector('textarea');
        
        // Set some text
        textarea.value = 'test message';
        
        // Simulate Enter key press (without shift)
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            shiftKey: false
        });
        
        textarea.dispatchEvent(enterEvent);
        
        // Check that handleElectronRender was called with the textarea
        expect(window.handleElectronRender).toHaveBeenCalledWith(textarea);
        
        // Check that textarea was cleared (mock behavior)
        expect(textarea.value).toBe('');
    });`;

content = content.replace(oldTest, newTest);

// Write back to file
fs.writeFileSync('tests/prompt-area.test.js', content);

console.log('Fixed alert test to use handleElectronRender');
