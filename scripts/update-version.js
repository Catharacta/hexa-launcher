import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from command line args or package.json
const args = process.argv.slice(2);
let version = args[0];

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

if (!version) {
    version = packageJson.version;
}

// Remove 'v' prefix if present for consistency
version = version.replace(/^v/, '');

console.log(`Updating version to: ${version}`);

// Configuration
const repoUrl = 'https://github.com/Catharacta/hexa-launcher';
const filesToUpdate = [
    '../README.md',
    '../docs/USER_GUIDE_JA.md',
    '../docs/USER_GUIDE_EN.md'
];

// Update package.json
if (packageJson.version !== version) {
    packageJson.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('Updated package.json');
}

// Update tauri.conf.json
const tauriConfPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
if (tauriConf.version !== version) {
    tauriConf.version = version;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
    console.log('Updated tauri.conf.json');
}

// Update Cargo.toml
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
if (fs.existsSync(cargoTomlPath)) {
    let cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
    const versionRegex = /^version\s*=\s*"[^"]+"/m;
    if (versionRegex.test(cargoContent)) {
        cargoContent = cargoContent.replace(versionRegex, `version = "${version}"`);
        fs.writeFileSync(cargoTomlPath, cargoContent);
        console.log('Updated Cargo.toml');
    }
}

// Update documentation files
filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Update version badge in README
        content = content.replace(/version-\d+\.\d+\.\d+/g, `version-${version}`);

        // Update download links (if they contain version)
        content = content.replace(/hexa-launcher-app_\d+\.\d+\.\d+/g, `hexa-launcher-app_${version}`);

        // Update repository URLs
        // Replace placeholders or old URLs with the configured repoUrl
        const repoBase = repoUrl.replace('https://github.com/', '');
        content = content.replace(/github\.com\/your-repo\/hexa-launcher/g, `github.com/${repoBase}`);

        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    } else {
        console.warn(`File not found: ${file}`);
    }
});

console.log('Version update complete!');
