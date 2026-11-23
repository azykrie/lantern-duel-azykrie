/**
 * Hand-in program for Lantern Duel.
 * Copies the static game and its real browser screenshots into the output
 * directory, then asks the kit's library to derive the judge's dossier.
 */

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const sourceDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(sourceDir, 'game'), join(outputDir, 'game'), { recursive: true });

const pictureDir = join(outputDir, 'screenshots');
mkdirSync(pictureDir, { recursive: true });
if (existsSync(join(sourceDir, 'screenshots'))) {
  cpSync(join(sourceDir, 'screenshots'), pictureDir, { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Handed in Lantern Duel to ${outputDir} (${dossier.length} dossier bytes)`);
