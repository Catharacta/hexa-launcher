const fs = require('fs');
const path = require('path');

// Get version from command line args or package.json
const args = process.argv.slice(2);
let version = args[0];

if (!version) {
    const packageJson = require('../package.json');
    version = packageJson.version;
}

// Remove 'v' prefix if present for consistency
version = version.replace(/^v/, '');

console.log(`Updating version to: ${version}`);

// Configuration
const repoUrl = 'https://github.com/Catharacta/hexa-launcher'; // Will be updated by user
const filesToUpdate = [
    '../README.md',
    '../docs/USER_GUIDE_JA.md',
    '../docs/USER_GUIDE_EN.md'
];

// Update package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = require(packageJsonPath);
if (packageJson.version !== version) {
    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('Updated package.json');
}

// Update tauri.conf.json
const tauriConfPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConf = require(tauriConfPath);
if (tauriConf.version !== version) {
    tauriConf.version = version;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
    console.log('Updated tauri.conf.json');
}

// Update documentation files
filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Update version badge in README
        content = content.replace(/version-\d+\.\d+\.\d+/g, `version-${version}`);

        // Update download links (if they contain version)
        // Example: hexa-launcher-app_0.1.0_x64_en-US.msi
        content = content.replace(/hexa-launcher-app_\d+\.\d+\.\d+/g, `hexa-launcher-app_${version}`);

        // Update generic version references if strictly formatted (risky, so sticking to safe replacements)

        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    } else {
        console.warn(`File not found: ${file}`);
    }
});

console.log('Version update complete!');
