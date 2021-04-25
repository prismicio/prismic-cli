import path from 'path';
import os from 'os';
import fsSync, { promises as fs } from 'fs';
import Authentication from './authentication';
import CustomTypes from '../common/customtypes';
import Helpers from '../helpers';
import { ctx, setCookies } from '../context';
import { get as getSmFile, buildCustomTypes } from './slicemachine/methods/sm';
import { getProjectSlices } from './slicemachine/common/libraries';
import Communication from '../services/communication';

const customTypesUrl = 'https://customtypes.prismic.io/customtypes';
const slicesUrl = 'https://customtypes.prismic.io/slices';
const aclUrl = 'https://0yyeb2g040.execute-api.us-east-1.amazonaws.com/prod/';

function parseProjectFromSmFile(smFile) {
  return smFile.apiEndpoint.split('://')[1].split('.cdn.prismic.io')[0];
}

const AUTH_KEY = 'prismic-auth';
// https://gist.github.com/rendro/525bbbf85e84fa9042c2
const parseCookies = (cookies) => cookies.split(';').reduce((res, c) => {
  const [key, val] = c.trim().split('=').map(decodeURIComponent);
  const allNumbers = (str) => /^\d+$/.test(str);
  try {
    return Object.assign(res, {
      [key]: allNumbers(val) ? val : JSON.parse(val),
    });
  } catch (e) {
    return Object.assign(res, {
      [key]: val,
    });
  }
}, {});
const parseAuth = (cookies = '') => {
  const parsed = parseCookies(cookies);
  if (parsed[AUTH_KEY]) {
    return { auth: parsed[AUTH_KEY] };
  }
  return {
    auth: null,
    authError: {
      status: 400,
      reason: `Could not find cookie "${AUTH_KEY}" in ~/.prismic file`,
    },
  };
};

const parsePrismicFile = () => {
  const home = os.homedir();
  try {
    const prismic = path.join(home, '.prismic');
    if (!fsSync.existsSync(prismic)) {
      return {
        err: { status: 400 },
        reason: '~/.prismic file not found. Please log in to Prismic.',
      };
    }
    const { cookies, base } = JSON.parse(fsSync.readFileSync(prismic, 'utf-8'));
    return { cookies, base };
  } catch (e) {
    return {
      err: e,
      reason:
        'Could not parse file at ~/.prismic. Are you logged in to Prismic?',
    };
  }
};

const getPrismicData = () => {
  const {
    cookies, base, err, reason,
  } = parsePrismicFile();
  if (err) {
    return { auth: null, authError: { err, reason } };
  }
  return {
    base,
    ...parseAuth(cookies),
  };
};

function getHeaders() {
  const smFile = getSmFile();
  const project = parseProjectFromSmFile(smFile);

  return {
    Authorization: `Bearer ${getPrismicData().auth}`,
    repository: project,
  };
}

function getAcl() {
  const headers = getHeaders();
  return Communication.theFetch(new URL('create', aclUrl), {
    headers,
    method: 'GET',
  }).then((res) => res.json());
}

function getLocalScreenshotPath({ libPath, sliceName }) {
  return path.join(
    process.cwd(),
    './.slicemachine/assets',
    libPath,
    sliceName,
    'preview.png',
  );
}

async function imageHasChanged({ imageUrl, localScreenshotPath }) {
  const imageBlob = await Communication.theFetch(imageUrl)
    .then((res) => res.blob())
    .then((res) => res.text());
  const localImage = await fs.readFile(localScreenshotPath, 'utf-8');
  return localImage === imageBlob;
}

async function deleteImageFolder({ sliceName }) {
  const headers = getHeaders();
  return Communication.theFetch(new URL('delete-folder', aclUrl), {
    method: 'POST',
    body: JSON.stringify({ sliceName }),
    headers,
  });
}

async function uploadImage({ localScreenshotPath, sliceName }) {
  const headers = getHeaders();
  const aclResponse = await getAcl();

  const {
    values: { url, fields },
    imgixEndpoint,
  } = aclResponse;

  const filename = path.basename(localScreenshotPath);
  const key = `${
    headers.repository
  }/shared-slices/${sliceName}/${new Date().getTime()}-preview.png`;
  await Communication.upload({
    url,
    fields,
    key,
    filename,
    pathToFile: localScreenshotPath,
  });

  return `${imgixEndpoint}/${key}`;
}

async function upsertType({
  existingModels, model, libMap, url,
}) {
  const headers = getHeaders();
  const doesExist = existingModels.find(
    (existingType) => model.id === existingType.id,
  );
  const isSlice = model?.type === 'SharedSlice';
  const { imageUrl } = doesExist || {};
  const localScreenshotPath = isSlice
    && getLocalScreenshotPath({
      libPath: libMap[model.id],
      sliceName: model.name,
    });
  const imageChanged = imageUrl
    && doesExist
    && (await imageHasChanged({
      imageUrl,
      localScreenshotPath,
    }));
  const shouldUploadImage = imageChanged || (!doesExist && isSlice);
  let currentUrl = doesExist?.imageUrl;
  if (imageChanged) {
    deleteImageFolder({ sliceName: model.id });
  }
  if (shouldUploadImage) {
    currentUrl = await uploadImage({
      localScreenshotPath,
      sliceName: model.id,
    });
  }
  if (
    !shouldUploadImage
    && doesExist
    && JSON.stringify(doesExist) === JSON.stringify(model)
  ) {
    return Promise.resolve('Nothing changed');
  }

  return Communication.upsert(
    `${url}/${doesExist ? 'update' : 'insert'}`,
    // add imageurl
    JSON.stringify({ ...model, imageUrl: currentUrl }),
    {
      headers,
    },
  );
}

async function deleteType({ existingModel, models, url }) {
  const headers = getHeaders();
  const doesStillExist = models.find((model) => model.id === existingModel.id);
  if (!doesStillExist) {
    if (doesStillExist.imageUrl) {
      await deleteImageFolder({ sliceName: existingModel.id });
    }
    return Communication.delete(`${url}/${existingModel.id}`, undefined, {
      headers,
    });
  }
  return doesStillExist;
}

async function checkError(result) {
  const code = result.status || result.StatusCode;
  if (typeof result !== 'string' && code && code !== 200 && code !== 204) {
    const e = new Error(`Sync failed.
    Status: ${code}
    Message: ${await result.text()}
    `);
    e.statusCode = code;
    throw e;
  }
}

async function queryUpdateTypes({
  existingModels, models, libMap, url,
}) {
  const { deleteArg } = ctx;
  const allUpdates = await Promise.all(
    models.map((model) => upsertType({
      model,
      existingModels,
      libMap,
      url,
    })),
    ...(deleteArg
      ? existingModels.map((existingModel) => deleteType({ existingModel, models, url }))
      : []),
  );

  const hasError = allUpdates.map(checkError);
  return hasError || 'success';
}

function getExistingTypes(url) {
  const headers = getHeaders();
  // Helpers.UI.display(data);
  return Communication.getAsJson(url, undefined, {
    headers,
  });
}

function initCustomTypes(smFile, slices) {
  const customTypesTemplates = CustomTypes.read();
  return buildCustomTypes(customTypesTemplates, slices);
}

function initSlices(smFile) {
  return getProjectSlices(smFile, true);
}

function cleanCustomType(type) {
  const { value, name, ...cleanType } = type;
  return {
    ...cleanType,
    label: name,
    json: value,
    status: true,
  };
}

async function updateTypes() {
  try {
    const smFile = getSmFile();

    const { slices: slicesObject, libMap } = await initSlices(smFile);
    const slicesArray = Object.keys(slicesObject).map(
      (key) => slicesObject[key],
    );

    const customTypes = initCustomTypes(smFile, slicesObject);
    const cleanCustomTypes = customTypes.map(cleanCustomType);
    const existingSlices = getExistingTypes(slicesUrl);
    const existingCustomTypes = getExistingTypes(customTypesUrl);

    await Promise.all([
      queryUpdateTypes({
        models: slicesArray,
        existingModels: await existingSlices,
        url: slicesUrl,
        libMap,
      }),
      queryUpdateTypes({
        models: cleanCustomTypes,
        existingModels: await existingCustomTypes,
        url: customTypesUrl,
      }),
    ]);
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 303) {
      // remove cookie
      await Authentication.connect();

      setCookies('');
      return;
    }
    console.log(error);
    Helpers.UI.displayErrors('An unexpected error occured');
    throw new Error(`Repository creation failed. 
    Status: ${error.statusCode}
    `);
  }
}

export default updateTypes;
