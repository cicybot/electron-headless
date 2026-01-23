/**
 * Test for showPromptArea functionality
 * Tests that the prompt area shows, handles enter key correctly, and alerts value
 * 
 * @jest-environment jsdom
 */

describe('showPromptArea', () => {
    beforeEach(() => {
        // Set up DOM environment
        document.body.innerHTML = '';
        
        // Mock the global window._G object and handleElectronRender function
        window._G = {
            showPromptArea: require('../src/utils-browser.js').showPromptArea,
            hidePromptArea: require('../src/utils-browser.js').hidePromptArea
        };
        
        // Mock the window.handleElectronRender function
        window.handleElectronRender = jest.fn((textarea) => {
            // Mock the behavior: clear textarea value
            textarea.value = '';
        });
    });

    afterEach(() => {
        // Clean up after each test
        const promptDiv = document.getElementById('__promptDiv');
        if (promptDiv) {
            promptDiv.remove();
        }
    });

    it('should create a prompt area with textarea', () => {
        window._G.showPromptArea();
        
        const promptDiv = document.getElementById('__promptDiv');
        expect(promptDiv).toBeTruthy();
        
        const textarea = promptDiv.querySelector('textarea');
        expect(textarea).toBeTruthy();
        
        // Check that it has the expected styles
        expect(promptDiv.style.position).toBe('fixed');
        expect(promptDiv.style.zIndex).toBe('2147483647');
    });

    it('should handle enter key to call handleElectronRender and clear', () => {
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
    });

    it('should not alert on Enter+Shift', () => {
        const mockAlert = jest.fn();
        global.alert = mockAlert;
        
        window._G.showPromptArea();
        
        const promptDiv = document.getElementById('__promptDiv');
        const textarea = promptDiv.querySelector('textarea');
        
        // Set some text
        textarea.value = 'test message';
        
        // Simulate Enter+Shift key press
        const enterShiftEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            shiftKey: true
        });
        
        textarea.dispatchEvent(enterShiftEvent);
        
        // Should not alert on Enter+Shift
        expect(mockAlert).not.toHaveBeenCalled();
        
        // Text should remain unchanged
        expect(textarea.value).toBe('test message');
    });

    it('should not alert on empty value', () => {
        const mockAlert = jest.fn();
        global.alert = mockAlert;
        
        window._G.showPromptArea();
        
        const promptDiv = document.getElementById('__promptDiv');
        const textarea = promptDiv.querySelector('textarea');
        
        // Leave textarea empty
        textarea.value = '';
        
        // Simulate Enter key press
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            shiftKey: false
        });
        
        textarea.dispatchEvent(enterEvent);
        
        // Should not alert on empty value
        expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should remove existing prompt area when creating new one', () => {
        // Create first prompt area
        window._G.showPromptArea();
        const firstPromptDiv = document.getElementById('__promptDiv');
        expect(firstPromptDiv).toBeTruthy();
        
        // Create second prompt area
        window._G.showPromptArea();
        const secondPromptDiv = document.getElementById('__promptDiv');
        expect(secondPromptDiv).toBeTruthy();
        
        // Should only have one prompt div
        const allPromptDivs = document.querySelectorAll('#__promptDiv');
        expect(allPromptDivs.length).toBe(1);
    });
});
    it('should display position and size in header', () => {
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
        expect(positionDisplay.textContent).toMatch(/Pos: \d+,\d+ \| Size: \d+×\d+/);
        
        // Test initial position and size
        const initialText = positionDisplay.textContent;
        expect(initialText).toContain('Pos: 50,50');
        expect(initialText).toContain('Size: 600×200');
    });

    it('should have visibility toggle checkbox', () => {
        window._G.showPromptArea();
        
        const promptDiv = document.getElementById('__promptDiv');
        const visibilityCheckbox = promptDiv.querySelector('#prompt-visibility');
        const visibilityLabel = promptDiv.querySelector('label[for="prompt-visibility"]');
        
        expect(visibilityCheckbox).toBeTruthy();
        expect(visibilityCheckbox.type).toBe('checkbox');
        expect(visibilityCheckbox.checked).toBe(true);
        expect(visibilityLabel).toBeTruthy();
        expect(visibilityLabel.textContent).toBe('Visible');
        
        // Check textarea is initially visible
        const textarea = promptDiv.querySelector('textarea');
        expect(textarea.style.display).not.toBe('none');
    });

    it('should toggle textarea visibility when checkbox is changed', () => {
        window._G.showPromptArea();
        
        const promptDiv = document.getElementById('__promptDiv');
        const visibilityCheckbox = promptDiv.querySelector('#prompt-visibility');
        const visibilityLabel = promptDiv.querySelector('label[for="prompt-visibility"]');
        const textarea = promptDiv.querySelector('textarea');
        
        // Initially visible
        expect(textarea.style.display).not.toBe('none');
        expect(visibilityLabel.textContent).toBe('Visible');
        
        // Hide textarea
        visibilityCheckbox.checked = false;
        visibilityCheckbox.dispatchEvent(new Event('change'));
        
        expect(textarea.style.display).toBe('none');
        expect(visibilityLabel.textContent).toBe('Hidden');
        
        // Show textarea again
        visibilityCheckbox.checked = true;
        visibilityCheckbox.dispatchEvent(new Event('change'));
        
        expect(textarea.style.display).not.toBe('none');
        expect(visibilityLabel.textContent).toBe('Visible');
    });
