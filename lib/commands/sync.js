import Authentication from './authentication';
import CustomTypes from '../common/customtypes';
import Helpers from '../helpers';
import { ctx, setCookies } from '../context';
import { get as getSmFile, buildCustomTypes } from './slicemachine/methods/sm';
import { getProjectSlices } from './slicemachine/common/libraries';
import Communication from '../services/communication';

const url = 'https://customtypes.prismic.io/customtypes';

function parseProjectFromSmFile(smFile) {
  return smFile.apiEndpoint.split('://')[1].split('.cdn.prismic.io')[0];
}

function getHeaders() {
  const { token } = ctx;
  const smFile = getSmFile();
  const project = parseProjectFromSmFile(smFile);

  return {
    Authorization: `Bearer ${token}`,
    repository: project,
  };
}

async function upsertType({ existingTypes, currentType }) {
  const headers = getHeaders();
  const doesExist = existingTypes.some(
    (existingType) => currentType.id === existingType.id,
  );
  const { value, name, ...cleanType } = currentType;
  return Communication.upsert(
    `${url}/${doesExist ? 'update' : 'insert'}`,
    JSON.stringify({
      ...cleanType,
      label: name,
      json: value,
      status: true,
    }),
    {
      headers,
    },
  );
}

async function deleteType({ existingTypes, currentType }) {
  const headers = getHeaders();
  const doesStillExist = existingTypes.some(
    (existingType) => currentType.id === existingType.id,
  );
  if (!doesStillExist) {
    return Communication.delete(url, undefined, {
      headers,
    });
  }
  return doesStillExist;
}

function checkError(result) {
  const code = result.status || result.StatusCode;
  if (typeof result !== 'string' && code && code !== 200 && code !== 204) {
    const e = new Error(`Sync failed. Status: ${code}`);
    e.statusCode = code;
    throw e;
  }
}

async function queryUpdateTypes({ customTypes }) {
  const headers = getHeaders();
  // Helpers.UI.display(data);
  const existingTypes = await Communication.getAsJson(url, undefined, {
    headers,
  });
  const { deleteArg } = ctx;
  const allUpdates = await Promise.all(
    customTypes.map((currentType) => upsertType({ existingTypes, currentType })),
    ...(deleteArg
      ? existingTypes.map((currentType) => deleteType({ existingTypes, currentType }))
      : []),
  );

  const hasError = allUpdates.some(checkError);
  return hasError || 'success';
}

async function initCustomTypes(smFile) {
  const customTypesTemplates = CustomTypes.read();
  const projectSlices = await getProjectSlices(smFile);
  return buildCustomTypes(customTypesTemplates, projectSlices);
}

async function updateTypes(types) {
  let customTypes;
  try {
    await (async () => {
      const smFile = getSmFile();

      customTypes = types || (await initCustomTypes(smFile));

      await Authentication.connect();
      await queryUpdateTypes({
        customTypes,
      });
    })();
  } catch (error) {
    console.log(error);
    if (error.statusCode === 401 || error.statusCode === 303) {
      // remove cookie
      setCookies('');
      return;
    }
    Helpers.UI.displayErrors('An unexpected error occured');
    throw new Error(`Repository creation failed. Status: ${error.statusCode}`);
  }
}

export default updateTypes;
