const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/utils-browser.js', 'utf8');

// Find and replace the visibility toggle logic
const oldLogic = `  visibilityCheckbox.addEventListener("change", (e) => {
    const actionButtonContainer = buttonContainer.querySelector('div:last-child');
    if (e.target.checked) {
      textarea.style.display = "block";
      actionButtonContainer.style.display = "flex";
      visibilityLabel.textContent = "Visible";
    } else {
      textarea.style.display = "none";
      actionButtonContainer.style.display = "none";
      visibilityLabel.textContent = "Hidden";
    }
  });`;

const newLogic = `  // Define the action button container before the event listener
  // This will be assigned later
  let actionButtonContainer;
  
  visibilityCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      textarea.style.display = "block";
      if (actionButtonContainer) actionButtonContainer.style.display = "flex";
      visibilityLabel.textContent = "Visible";
    } else {
      textarea.style.display = "none";
      if (actionButtonContainer) actionButtonContainer.style.display = "none";
      visibilityLabel.textContent = "Hidden";
    }
  });`;

// Replace the old logic with new logic
content = content.replace(oldLogic, newLogic);

// Now find the line where actionButtonContainer is actually defined and replace it
const oldDeclaration = `  // Right side: action buttons
  const actionButtonContainer = document.createElement("div");`;

const newDeclaration = `  // Right side: action buttons
  actionButtonContainer = document.createElement("div");`;

content = content.replace(oldDeclaration, newDeclaration);

// Write back to file
fs.writeFileSync('src/utils-browser.js', content);

console.log('Fixed visibility toggle logic');
