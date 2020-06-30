import Repository from '../../repository';
import Authentication from '../../authentication';
import { ctx } from '../../../context';
import CustomTypes from '../../../common/customtypes';

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
    const repo = await createPrismicRepo(customTypes);
    const [protocol, base] = ctx.base.split('://');
    if (!protocol || !base) return [`Base url "${ctx.base}" is invalid: did you forget to specify protocol?`, null];

    return `${protocol}://${repo.domain}.${protocol === 'https' ? 'cdn.' : ''}${ctx.base.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')}/api/v2`;
  }
  return null;
}


async function bootstrap() {
  const customTypes = CustomTypes.read();
  await createRepository(customTypes);
}

export default bootstrap;
