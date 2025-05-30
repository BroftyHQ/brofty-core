import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PREFS_PATH = path.join(__dirname, 'preferences.json');

function readPreferences(): Record<string, any> {
    if (!fs.existsSync(PREFS_PATH)) {
        return {};
    }
    const data = fs.readFileSync(PREFS_PATH, 'utf-8');
    try {
        return JSON.parse(data);
    } catch {
        return {};
    }
}

function writePreferences(prefs: Record<string, any>) {
    fs.writeFileSync(PREFS_PATH, JSON.stringify(prefs, null, 2), 'utf-8');
}

export function setPreference(key: string, value: any): void {
    const prefs = readPreferences();
    prefs[key] = value;
    writePreferences(prefs);
}

export function getPreference(key: string): any {
    const prefs = readPreferences();
    return prefs[key];
}
