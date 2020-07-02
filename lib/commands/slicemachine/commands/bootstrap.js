import Repository from '../../repository';
import Authentication from '../../authentication';
import { ctx } from '../../../context';
import CustomTypes from '../../../common/customtypes';
import { patch as patchSmFile } from '../methods/sm';

async function createPrismicRepo(customTypes) {
  const domain = await Repository.chooseDomain();
  await Authentication.connect();
  return Repository.createWithDomain({
    domain,
    customTypes,
  });
}

async function createRepository(customTypes) {
  if (!ctx.SliceMachine.noPrismic) {
    try {
      const repo = await createPrismicRepo(customTypes);
      const [protocol, base] = ctx.base.split('://');
      if (!protocol || !base) return [`Base url "${ctx.base}" is invalid: did you forget to specify protocol?`, null];

      return `${protocol}://${repo.domain}.${protocol === 'https' ? 'cdn.' : ''}${ctx.base.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')}/api/v2`;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  return null;
}


async function bootstrap(customTypesOpt) {
  const customTypes = customTypesOpt || CustomTypes.read();
  console.log(customTypes);
  if (!ctx.SliceMachine.noPrismic) {
    const apiEndpoint = await createRepository(customTypes);
    patchSmFile({ apiEndpoint });
    return apiEndpoint;
  }
  return null;
}

export default bootstrap;
