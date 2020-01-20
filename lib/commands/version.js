import Helpers from '../helpers';
import pjson from '../../package.json';

export default function () {
  Helpers.UI.display(pjson.version);
}
