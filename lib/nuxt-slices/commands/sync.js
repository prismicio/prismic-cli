import fs from 'fs';
import path from 'path';
import { parse } from 'vue-docgen-api';
import deepEqual from 'deep-equal';
import AdmZip from 'adm-zip';
// import shell from 'shelljs';
import Communication from '../../communication';
import Endpoints from '../misc/endpoints';

// These should be stored elsewhere: (probably in /misc lol)
import handleZipQuery, { SLICES_API_LOCAL, SLICES_API, ALL_MODELS } from '../handleZipQuery';

// const projectType = 'nuxt';
const prismicConfigPath = 'prismic.config.js';

const camelizeRE = /_(\w)/g;
export const camelize = str => str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

const hyphenateRE = /\B([A-Z])/g;
const hyphenate = str => str.replace(hyphenateRE, '-$1').toLowerCase();

const pascalize = str => capitalize(camelize(str));

// const testProject = (tests, projectPath = './') =>
//   tests.find(e => shell.test(e.arg, `${projectPath}${e.path}`) === false);

const pathToCustomTypes = path.join(process.cwd(), 'custom_types');

const isDirectory = source => fs.lstatSync(source).isDirectory();

const getPathsToSlices = source =>
  fs.readdirSync(source)
    .map(name => path.join(source, name))
    .filter(url => path.extname(url) === '.vue' || isDirectory(url))
    .map(e => (path.extname(e) === '.vue' ? e : `${e}/index.vue`));

async function handleCustomTypes(ct) {
  const index = ct.map(elem => ({
    id: elem.mask_id,
    name: elem.mask_name,
    repeatable: elem.mask_repeatable,
    value: `${elem.mask_id}.json`,
  }));

  await fs.promises.mkdir(pathToCustomTypes, { recursive: true });

  fs.writeFileSync(path.join(pathToCustomTypes, 'index.json'), JSON.stringify(index, null, 2), 'utf8');

  ct.forEach(({ mask_id: maskId, mask_value: maskValue }) => {
    fs.writeFileSync(path.join(pathToCustomTypes, `${maskId}.json`), JSON.stringify(maskValue, null, 2), 'utf8');
  });
}

function findSlice(pathToSlice) {
  try {
    const { displayName } = parse(pathToSlice);
    const pathToModel = pathToSlice.substring(0, pathToSlice.lastIndexOf('/')).concat('/model.json');
    console.log(pathToModel, 'pathToModel');
    const model = JSON.parse(fs.readFileSync(pathToModel, 'utf8'));
    return [displayName, model];
  } catch (e) {
    // console.error(e);
    return null;
  }
}
/**
 * should get all slices (keys + definitions) and match their
 */
async function handleSlices(ct, framework = 'nuxt', cookies, dev) {
  // const notFound = [];
  try {
    const url = `${(dev ? SLICES_API_LOCAL : SLICES_API)}${ALL_MODELS}?framework=${framework}`;
    return JSON.parse(await Communication.get(url, cookies));
  } catch (e) {
    return e;
  }
}

async function fetchSlices(sliceNames) {
  const slicesParam = sliceNames.map(pascalize).join(',');
  const maybeZipPath = await handleZipQuery(false, { slices: slicesParam, framework: 'nuxt' });
  if (maybeZipPath && maybeZipPath instanceof Error === false) {
    const zip = new AdmZip(maybeZipPath);
    zip.extractEntryTo('slices', path.join(process.cwd(), 'sliceMachine/slices'), true);
    console.log(maybeZipPath, zip);
  }
}

function matchSlicesIn(toMatchObj, dataset) {
  return Object.entries(toMatchObj).reduce(([miss, diff, equals], [key, value]) => {
    const item = dataset[key];
    if (item) {
      if (deepEqual(item, value)) return [miss, diff, { ...equals, [key]: value }];
      return [miss, { ...diff, [key]: { before: item, after: value } }, equals];
    }
    return [{ ...miss, [key]: value }, diff, equals];
  }, []);
}

export default async (url, cookies) => {
  // const projectType = testKeys.find(key => testProject(projectTests[key]));

  // console.log(projectType);

  try {
    const config = require(path.join(process.cwd(), prismicConfigPath)); // eslint-disable-line

    const domainUrl = Endpoints.root(config.default ? config.default.apiEndpoint : config.apiEndpoint);
    const customTypes = JSON.parse(await Communication.get(`${domainUrl}/customtypes/slices`, cookies));

    const allSlicesFromCT = customTypes.reduce((acc, customType) => ({ ...acc, ...customType.slices }), {});

    handleCustomTypes(customTypes);

    const slicesFromAPI = handleSlices(customTypes, 'nuxt', cookies, true);

    const pathToSlices = getPathsToSlices(path.join(process.cwd(), 'sliceMachine/slices'));
    // console.log('pathToSlice', pathToSlices);
    const projectSlices = pathToSlices.map(findSlice).filter(e => e)
      .reduce((acc, [k, v]) => ({
        ...acc,
        [hyphenate(k).replace(/-/g, '_')]: v,
      }), {});

    const [miss] = matchSlicesIn(projectSlices, allSlicesFromCT);

    fetchSlices(Object.keys(miss));
    // console.log(matchSlicesIn(mOrD, slicesFromAPI));
  } catch (e) {
    console.error(e);
  }
};
