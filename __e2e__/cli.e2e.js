/**
 * comands
 *
 * prismic login [ --email | --password | --oauthaccesstoken ]
 * prismic quickstart [--folder | --template | --new]
 * prismic init [ --folder ]
 * prismic new [ --folder ]
 * prismic theme [ --theme-url | --folder | --conf | --template ]
 * prismic logout
 * prismic signup
 * prismic list
 * prismic --version
 * prismic sm --help
 * primsic sm --ls
 * prismic sm --setup [ --no-prismic | --library | --lib | --local-path ]
 * prismic sm --bootstrap
 * prismic sm --create-slice [ --template-path | --framework ]
 * prismic sm --add-storybook [ --framework ]
 * prismic sm --pull
 *
 * [UN-DOCUMENTED]
 * prismic sm --sm-endpoint
 * prismic sm --override
 * prismic sm --yes|| -y || --noconfirm
 * prismic --debug
 * prismic base || --base
 * prismic --users
 * prismic --noconfirm
 * prismic --domain
 * prismic --endpoint
 * prismic --help
 * prismic heroku
 * 
 * */
const npm = require('npm');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');
const { promisify } = require('util');
const FormData = require('form-data');

const TMP_DIR = path.resolve('__tmp__');
const PRISMIC_BIN = require.resolve('../bin/prismic');

const readFile = promisify(fs.readFile);

const themeDir = path.join(TMP_DIR, 'theme-nuxt');

const initRepoName = genRepoName('cli-init-test');
const initRepoDir = path.join(TMP_DIR, 'init-test');

const rmdir = promisify(fs.rmdir);

beforeAll(() => {  
  const mkdir = promisify(fs.mkdir);
  const chmod = promisify(fs.chmod);
  const load = promisify(npm.load);
  const run = promisify(npm.run);

  return rmdir(TMP_DIR, { recursive: true })
    .then(() => mkdir(TMP_DIR))
    .then(() => load())
    .then(() => run('build'))
    .then(() => chmod(PRISMIC_BIN, 0o755))
});

describe('prismic --help', () => {
  test('it should write usage instructions to stdout', async () => {
    const res = spawnSync(PRISMIC_BIN, ['--help'], { encoding: 'utf8' });
    expect(res.stdout).toBeTruthy();
    expect(res.stdout).toMatchSnapshot();
    expect(res.stderr).toBeFalsy();
  });
});

describe('prismic --version', () => {
  it('should print out the current version on the cli', () => {
    const args = ['--version'];
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    // eslint-disable-next-line global-require
    const { version } = require('../package.json');
    const str = res.stdout.replace(/\r|\n/g, '');
    expect(str).toBe(version);
    expect(res.stderr).toBeFalsy();
  });
});

describe('prismic base', () => {
  it('should set the base address for prismic', () => {
    const address = process.env.PRISMIC_BASE || 'https://prismic.io'
    const args = ['base', '--base-url', address];
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf-8' });

    const configPath = path.resolve(os.homedir(), '.prismic');
    const configFile = fs.readFileSync(configPath, 'utf-8');
    const { base } = JSON.parse(configFile);

    expect(base).toBe(address);
    expect(res.stderr).toBeFalsy();
    expect(res.stdout).toBeTruthy();
    expect(res.stdout).toMatchSnapshot();
    expect(res.status).toBe(0);

  })
})

describe('prismic list', () => {
  it('should list the available templates', () => {
    const { stdout, stderr } = spawnSync(PRISMIC_BIN, ['list'], { encoding: 'utf8' });
    expect(stdout.includes('NodeJS')).toBe(true);
    expect(stdout.includes('React')).toBe(true);
    expect(stdout.includes('Angular2')).toBe(true);
    expect(stdout.includes('Vue.js')).toBe(true);
    expect(stderr).toBeFalsy();
  });
});

describe('prismic logout', () => {
  it('should log the user out', async () => {
    const { stdout, status } = spawnSync(PRISMIC_BIN, ['logout'], { encoding: 'utf8'});
    expect(stdout).toMatchSnapshot();
    expect(status).toBeFalsy();

    const prismicCookiePath = path.resolve(os.homedir(), '.prismic');
    return readFile(prismicCookiePath, { encoding: 'ascii' }).then((str) => {
      return JSON.parse(str);
    }).then((json) => {
      expect(json.cookies).toBeDefined();
      expect(json.cookies).toBeFalsy();
    });

  });
});


describe('prismic login [ --email | --password | --oauthaccesstoken ]', () => {
  it('should log a user in', () => {
    expect(process.env.PRISMIC_EMAIL).toBeDefined();
    expect(process.env.PRISMIC_PASSWORD).toBeDefined();
    const args = [
      'login',
      '--email', process.env.PRISMIC_EMAIL,
      '--password', process.env.PRISMIC_PASSWORD,
    ];
    const { stderr, stdout, status } = spawnSync(PRISMIC_BIN, args, { encoding: 'utf-8'});
    expect(stdout).toBeTruthy();
    expect(stdout).toMatchSnapshot();
    expect(stderr).toBeFalsy();
    expect(status).toBeFalsy();

  });
});

function isLogedin() {
  const confPath = path.resolve(os.homedir(), '.prismic');
  if(fs.existsSync(confPath) === false) return false;

  const conf = fs.readFileSync(confPath, 'utf-8');
  const { base, cookies } = JSON.parse(conf);
  return cookies ? true : false;
}

function login(email = process.env.PRISMIC_EMAIL, password = process.env.PRISMIC_PASSWORD) {
  if(isLogedin()) return; 
  const args = [ '--email', email, '--password', password]
  const res = spawnSync(PRISMIC_BIN, args, {encoding: 'utf-8'})
  if(res.status !== 0 || res.stderr) { throw new Error('Failed to login'); }
}

function genRepoName(repoName) {
  const email = process.env.PRISMIC_EMAIL || '';
  const name = email.slice(0, email.indexOf('@'));
  const sufix = name.replace(/\W/g,'')
  return `${repoName}-${sufix}`;
}

async function deleteRepo(repoName) {
  const confPath = path.resolve(os.homedir(), '.prismic');

  const conf = fs.readFileSync(confPath, 'utf-8');
  const { base, cookies } = JSON.parse(conf);
  const { x_xsfr } = cookies.match(/(?:X_XSRF=)(?<x_xsfr>(\w|-)*)/).groups;

  const addr = new URL(base);

  const formData = new FormData();
  formData.append("confirm", repoName);
  formData.append('password', process.env.PRISMIC_PASSWORD);

  return new Promise((resolve, reject) => {
    formData.submit({
      hostname: `${repoName}.${addr.host}`,
      path: `/app/settings/delete?_=${x_xsfr}`,
      protocol: addr.protocol,
      headers: {
        'cookie': cookies,
      },
    }, (err, res) => {
      if(err) return reject(err);
      /* let body = '';
      res.on('data', (d) => { body += d });
      res.on('end', resolve); */
      return resolve(); // this saves some time
    });
  });
};


describe('prismic new', () => {
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-new-test');

  beforeAll(async () => {
    login()
    await deleteRepo(repoName);
  });

  const dir = path.join(TMP_DIR, 'test-new');

  const args = [
    'new', 
    '--domain', repoName, 
    '--folder', dir, 
    '--template', 
    'NodeJS'
  ];

  it('should create a new project from a template', () => {
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8', shell: true });
    expect(res.stdout).toMatchSnapshot();
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(res.status).toBeFalsy();
  });
});

describe('prismic quickstart [--folder | --template | --new]', () => {
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-quickstart-test');

  beforeAll(async () => {
    login()
    await deleteRepo(repoName);
  });

  const dir = path.join(TMP_DIR, 'quickstart');
  const args = [
    'quickstart',
    '--folder', dir,
    '--domain', repoName,
    '--template', 'NodeJS',
    '--noconfirm'
  ];

  it('should initialize a project and repository', () => {
    
    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    expect(res.stdout).toMatchSnapshot();
    expect(fs.existsSync(dir)).toBe(true);
    expect(res.status).toBeFalsy();

  });
});

describe('prismic init', () => {
  jest.setTimeout(300000);

  const repoName = initRepoName; 
  const dir = initRepoDir;
  const args = [
    '--folder', dir,
    '--domain', repoName,
    '--template', 'NodeJS',
    '--noconfirm',
  ];

  beforeAll(async () => {
    login();
    await deleteRepo(repoName)
  });

  it('should initialise a project from a template and create a new repo', () => {
    const res = spawnSync(PRISMIC_BIN, ['init', ...args, '--new' ], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(res.stdout).toMatchSnapshot();
    expect(res.status).toBeFalsy();
  });

  it('should initialise a project from a template with an existing repo', async () => {
    await rmdir(dir, { recursive: true });
    
    const res = spawnSync(PRISMIC_BIN, ['init', ...args ], { encoding: 'utf8', shell: true });
    expect(fs.existsSync(dir)).toBeTruthy();
    expect(res.stdout).toMatchSnapshot();
    expect(res.status).toBeFalsy();
  });
});


describe('prismic theme [ --theme-url | --folder | --conf | --template ]', () => {
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-theme-test-two');

  beforeAll(async () => {
    login()
    return deleteRepo(repoName);
  });


  it('should create a project using a theme', () => {

    const dir = themeDir;
    const args = [
      'theme',
      '--theme-url', 'https://github.com/prismicio/nuxtjs-blog.git',
      '--conf', 'nuxt.config.js',
      '--domain', repoName,
      '--folder', dir,
    ];

    const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
    expect(res.stdout).toBeTruthy();
    expect(res.stdout).toMatchSnapshot();

    expect(fs.existsSync(dir)).toBe(true);
    expect(res.status).toBeFalsy();

  })
});

describe('prismic sm --help', () => {
  const args = ['sm', '--help'];
  const res = spawnSync(PRISMIC_BIN, args, { encoding: 'utf8' });
  expect(res.stdout).toBeTruthy();
  expect(res.stderr).toBeFalsy();
  // expect(res.stdout).toMatchSnapshot();
});

describe('prismic sm --setup [ --no-prismic | --library | --lib | --local-path ]', () => {
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-setup-test');

  beforeAll(async () => {
    login()
    await deleteRepo(repoName);
  });

  it('should setup an existing project for slicemachine', () => {
    const args = ['sm', '--setup', '--domain', repoName ]
    const cmd = `pushd ${themeDir} && ${PRISMIC_BIN}`;
    const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true });

    expect(res.stdout).toBeTruthy();
    const smfile = path.resolve(themeDir, 'sm.json');
    expect(fs.existsSync(smfile)).toBe(true);
    // expect(res.stderr).toBeFalsy();

    // expect(res.stdout).toMatchSnapshot();
    // expect(res.stderr).toMatchSnapshot();
    expect(res.status).toBeFalsy();

  })

});

describe('prismic sm --bootstrap', () => {
  jest.setTimeout(300000);

  const repoName = genRepoName('cli-sm-setup-test');

  beforeAll(async () => {
    login()
    await deleteRepo(repoName);
  });

  it('should setup an existing project for slicemachine', () => {
    const args = ['sm', '--bootstrap', '--domain', repoName ]
    const cmd = `pushd ${initRepoDir} && ${PRISMIC_BIN}`;
    const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true });

    expect(res.stdout).toBeTruthy();
    const smfile = path.resolve(initRepoDir, 'sm.json');
    
    expect(fs.existsSync(smfile)).toBe(true);
    expect(res.stdout).toMatchSnapshot();
    expect(res.stderr).toMatchSnapshot();
    expect(res.status).toBeFalsy();


  })
});

describe('prismic sm --ls', () => {
  it('should list slices', () => {
    const args = ['sm', '--ls' ];
    const cmd = `pushd ${themeDir} && ${PRISMIC_BIN}`;
  
    const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true });
    
    expect(res.stdout).toBeTruthy();
    expect(res.stdout).toMatchSnapshot();
    expect(res.stderr).toMatchSnapshot();
    expect(res.status).toBeFalsy();

  })
});

describe('prismic sm --create-slice [ --local-library | --slice-name ]', () => {
  jest.setTimeout(300000);
  beforeAll(() => {
    return login()
  });

  it('should create a new loccal slice', () => {
    const sliceDir = 'slices';
    const sliceName = 'MySlice';
    const args = [
      'sm',
      '--create-slice',
      '--local-library', sliceDir,
      '--slice-name', sliceName,
    ]

    const cmd = `pushd ${themeDir} && npx nuxt telemetry disable && ${PRISMIC_BIN}`

    // console.log(cmd, args.join(' '));
  
    const res = spawnSync(cmd, args, { encoding: 'utf8', shell: true })

    expect(res.stderr).toBeFalsy();
    expect(res.stdout).toBeTruthy();

    const outDir = path.resolve(themeDir, sliceDir, sliceName);
    expect(fs.existsSync(outDir)).toBe(true);

    expect(res.stdout).toMatchSnapshot();
    expect(res.stderr).toMatchSnapshot();
    expect(res.status).toBeFalsy();

  })
 
});

describe('prismic sm --add-storybook [ --framework ]', () => {
  jest.setTimeout(300000);


  it('should add storybook to a project', () => {
    const addDevDeps = 'npm install --save-dev core-js@3 @babel/runtime-corejs3'
    const cmd = `pushd ${themeDir} && ${addDevDeps} && ${PRISMIC_BIN}`;
    const args = ['sm', '--add-storybook', '--no-start'];

    const res = spawnSync(cmd, args, { encoding: 'utf-8', shell: true });

    expect(res.stdout).toBeTruthy();
    // expect(res.stdout).toMatchSnapshot();
    // expect(res.stderr).toMatchSnapshot();
    expect(res.status).toBeFalsy();
    
    expect(fs.existsSync(path.resolve(themeDir, '.nuxt-storybook'))).toBe(true);
  })
})

describe.skip('prismic sm --develop', () => {
  beforeAll(() => {
    return login();
  })
  it('should login authorize with custom-types api', () => {
    const args = ['sm', '--develop', '--no-start'];
    const cmd = `pushd ${themeDir} && ${PRISMIC_BIN}`;
    const res = spawnSync(cmd, args, { encoding: 'utf-8', shell: true });
    expect(res.status).toBeFalsy();
    expect(res.error).toBeFalsy();

  });
});

describe('create next app', () => {
  const repoName = genRepoName("cli-next-app-setup");

  beforeAll(() => {
    login();
    return deleteRepo(repoName)
  });


  it('should work with create-next-app', () => {
    const dir = path.resolve(TMP_DIR, 'next-app-test');

    const cmd = `npx create-next-app ${dir} && pushd ${dir} && ${PRISMIC_BIN}`;
    const args = ['sm', '--setup', '--domain', repoName];

    const smJsonPath = path.resolve(dir, 'sm.json');
    const smResolverPath = path.resolve(dir, 'sm-resolver.js')

    const res = spawnSync(cmd, args, { encoding: 'utf-8', shell: true });

    expect(res.status).toBeFalsy();
    expect(fs.existsSync(smJsonPath)).toBe(true);
    expect(fs.existsSync(smResolverPath)).toBe(true);

  })
})

describe.skip('prismic signup', () => {});