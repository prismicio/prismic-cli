import fs from 'fs';
import path from 'path';
import Communication from '../../communication';


function handleCustomTypes(ct) {
  const index = ct.map(elem => ({
    id: elem.id,
    name: elem.name || elem.label, // ?
    repeatable: elem.repeatable,
    value: `${elem.id}.json`,
  }));

  fs.writeFileSync(path.join('custom_types', 'index.json'), JSON.stringify(index), 'utf8');

  ct.forEach(({ id, value }) => {
    fs.writeFileSync(path.join('custom_types', `${id}.json`), JSON.stringify(value), 'utf8');
  });
}

export default async (url, cookies) => {
  console.log('start sync');

  try {
    const jssonCt = Communication.get('http://repo.wroom.test/customtypes', cookies);
  } catch (e) {
    console.error(e)
  }
  handleCustomTypes(ct);
};
