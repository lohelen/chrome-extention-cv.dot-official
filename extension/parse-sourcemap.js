import fs from 'fs';
import { SourceMapConsumer } from 'source-map';

async function main() {
    const rawSourceMap = fs.readFileSync('/Users/helenlo/.gemini/antigravity/scratch/cv-optimizer-extension/dist/main.js.map', 'utf8');

    await SourceMapConsumer.with(rawSourceMap, null, consumer => {
        // Primary crash location
        const pos1 = consumer.originalPositionFor({ line: 40, column: 4859 });
        console.log('Crash #1 (line 40, col 4859):');
        console.log(pos1);

        // h6 frame
        const pos2 = consumer.originalPositionFor({ line: 40, column: 2210 });
        console.log('\nCrash #2 (line 40, col 2210):');
        console.log(pos2);
    });
}
main().catch(console.error);
