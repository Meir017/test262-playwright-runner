import { default as JSZip } from 'jszip';
import * as path from 'path';
import * as fs from 'fs';
import { default as packageJson } from '../package.json' assert { type: 'json' };
const { test262CommitHash } = packageJson.config;

const outputFile = path.resolve(process.cwd(), 'resources', 'test262.json');
const zipFile = path.resolve(process.cwd(), 'resources', 'test262.zip');

if (!fs.existsSync(zipFile)) {
    console.log(`Downloading test262@${test262CommitHash}...`);
    const response = await fetch(`https://github.com/tc39/test262/archive/${test262CommitHash}.zip`);
    console.info('Writing test262.zip...');
    await fs.promises.writeFile(zipFile, Buffer.from(await response.arrayBuffer()));

    console.info('Completed Writing test262.zip');
}

const test262Buffer = await fs.promises.readFile(zipFile);

console.log('Unzipping test262...');

const zip = await JSZip.loadAsync(test262Buffer);
const map = {};
for (const file in zip.files) {
    const zipEntry = zip.files[file];
    const normalizedName = file.substring(`test262-${test262CommitHash}/`.length);
    if (normalizedName.endsWith('.js') && (normalizedName.startsWith('test/') || normalizedName.startsWith('harness/'))) {
        const content = await zipEntry.async('string');
        map[normalizedName] = content;
    }
}
console.log(`Writing ${Object.keys(map).length} files to ${outputFile}...`);
await fs.promises.writeFile(outputFile, JSON.stringify(map, null, 2));