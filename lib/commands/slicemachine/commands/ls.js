import consola from 'consola';
import Libraries from '../common/libraries';
import { getOrFail as getSmFile } from '../methods/sm';

const emojis = ['🥒', '🍕', '⚾️', '🏀'];
function displayLibs(libs) {
  const count = libs.reduce((acc, [, s]) => acc + s.length, 0);
  consola.info(`Found ${count} slices across ${libs.length} libraries:`);
  libs.filter(([, s]) => s.length).forEach(([lib, sliceNames], i) => {
    console.log(`\n${emojis[i] || '🌸'} at ${lib}:`);
    sliceNames.forEach((slice) => console.log(`  * ${slice}`));
  });
  console.log('');
  consola.info('Something\'s missing?\nCheck paths in your configuration file!\n');
}

/* eslint-disable  consistent-return */
async function ls() {
  const sm = getSmFile();
  const extractedLibs = sm.libraries.map((lib) => {
    const slices = Libraries.slicesModels(lib);
    const sliceNames = Object.keys(slices);

    return [lib, sliceNames];
  });

  displayLibs(extractedLibs);

  return extractedLibs;
}

export default ls;
