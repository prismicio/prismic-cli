/* eslint-disable no-console */
import * as path from 'path'

import PrismicGenerator from '../base'

import * as inquirer from 'inquirer'

const saoSettings = require('create-nuxt-app/lib/saofile')

const evaluate = (exp: string, data: any): any => {
  /* eslint-disable no-new-func */
  const fn = new Function('data', `with (data) { return ${exp} }`)
  try {
    return fn(data)
  } catch (error) {
    console.error(error.stack)
    console.error(`Error when evaluating filter condition: ${exp}`)
  }
}

interface SaoTemplateData {
  typescript: boolean;
  pwa: boolean;
  eslint: boolean;
  prettier: boolean;
  lintStaged: boolean;
  stylelint: boolean;
  commitlint: boolean;
  axios: boolean;
  edge: string;
  pm: string;
  pmRun: string;
  content: string;
}

export default class Nuxt extends PrismicGenerator {
  answers: inquirer.Answers = {}

  sao = {opts: {}}

  outDir?: string;
  /**
   * initializing - Your initialization methods (checking current project state, getting configs, etc)
   * prompting - Where you prompt users for options (where you’d call this.prompt())
   * configuring - Saving configurations and configure the project (creating .editorconfig files and other metadata files)
   * default - If the method name doesn’t match a priority, it will be pushed to this group.
   * writing - Where you write the generator specific files (routes, controllers, etc)
   * conflicts - Where conflicts are handled (used internally)
   * install - Where installations are run (npm, bower)
   * end - Called last, cleanup, say good bye, etc
   */

  async initializing() {
    this.destinationRoot(this.path)
  }

  async prompting() {
    // ask normal nuxt questions from create-nuxt-app/lib/prompts
    this.answers = await inquirer.prompt([
      {
        name: 'name',
        message: 'Project name:',
        default: this.domain,
      },
      {
        name: 'language',
        message: 'Programming language:',
        choices: [
          {name: 'JavaScript', value: 'js'},
          {name: 'TypeScript', value: 'ts'},
        ],
        type: 'list',
        default: 'js',
      },
      {
        name: 'pm',
        message: 'Package manager:',
        choices: [
          {name: 'Yarn', value: 'yarn'},
          {name: 'Npm', value: 'npm'},
        ],
        type: 'list',
        default: 'yarn',
      },
      {
        name: 'ui',
        message: 'UI framework:',
        type: 'list',
        pageSize: 15,
        choices: [
          {name: 'None', value: 'none'},
          {name: 'Ant Design Vue', value: 'ant-design-vue'},
          {name: 'BalmUI', value: 'balm-ui'},
          {name: 'Bootstrap Vue', value: 'bootstrap'},
          {name: 'Buefy', value: 'buefy'},
          {name: 'Bulma', value: 'bulma'},
          {name: 'Chakra UI', value: 'chakra-ui'},
          {name: 'Element', value: 'element-ui'},
          {name: 'Framevuerk', value: 'framevuerk'},
          {name: 'iView', value: 'iview'},
          {name: 'Tachyons', value: 'tachyons'},
          {name: 'Tailwind CSS', value: 'tailwind'},
          {name: 'Vuesax', value: 'vuesax'},
          {name: 'Vuetify.js', value: 'vuetify'},
          {name: 'Oruga', value: 'oruga'},
        ],
        default: 'none',
      },
      {
        name: 'features',
        message: 'Nuxt.js modules:',
        type: 'checkbox',
        pageSize: 10,
        choices: [
          {name: 'Axios - Promise based HTTP client', value: 'axios'},
          {name: 'Progressive Web App (PWA)', value: 'pwa'},
          {name: 'Content - Git-based headless CMS', value: 'content'},
        ],
        default: [],
      },
      {
        name: 'linter',
        message: 'Linting tools:',
        type: 'checkbox',
        pageSize: 10,
        choices: [
          {name: 'ESLint', value: 'eslint'},
          {name: 'Prettier', value: 'prettier'},
          {name: 'Lint staged files', value: 'lintStaged'},
          {name: 'StyleLint', value: 'stylelint'},
          {name: 'Commitlint', value: 'commitlint'},
        ],
        default: [],
      },
      {
        name: 'test',
        message: 'Testing framework:',
        type: 'list',
        choices: [
          {name: 'None', value: 'none'},
          {name: 'Jest', value: 'jest'},
          {name: 'AVA', value: 'ava'},
          {name: 'WebdriverIO', value: 'webdriverio'},
          {name: 'Nightwatch', value: 'nightwatch'},
        ],
        default: 'none',
      },
      {
        name: 'mode',
        message: 'Rendering mode:',
        type: 'list',
        choices: [
          {name: 'Universal (SSR / SSG)', value: 'universal'},
          {name: 'Single Page App', value: 'spa'},
        ],
        default: 'universal',
      },
      {
        name: 'target',
        message: 'Deployment target:',
        type: 'list',
        choices: [
          {name: 'Server (Node.js hosting)', value: 'server'},
          {name: 'Static (Static/JAMStack hosting)', value: 'static'},
        ],
        default: 'server',
      },
      {
        name: 'devTools',
        message: 'Development tools:',
        type: 'checkbox',
        choices: [
          {name: 'jsconfig.json (Recommended for VS Code if you\'re not using typescript)', value: 'jsconfig.json'},
          {name: 'Semantic Pull Requests', value: 'semantic-pull-requests'},
          {name: 'Dependabot (For auto-updating dependencies, GitHub only)', value: 'dependabot'},
        ],
        default: [],
      },
      {
        when: ({test, linter}) => test !== 'none' || linter.length > 0,
        name: 'ci',
        message: 'Continuous integration:',
        type: 'list',
        choices: [
          {name: 'None', value: 'none'},
          {name: 'GitHub Actions (GitHub only)', value: 'github-actions'},
        ],
        default: 'none',
      },
      { // TODO: some of this logic is broken in create-nuxt-app as selecting vcs should ask user name?
        when: ({devTools, ci}) => devTools.includes('dependabot') || ci !== 'none',
        name: 'gitUsername',
        message: 'What is your GitHub username?',
        default: this.user.github.username,
        filter: val => val.toLowerCase(),
        // store: true
      },
      {
        name: 'vcs',
        message: 'Version control system:',
        type: 'list',
        choices: [
          {name: 'Git', value: 'git'},
          {name: 'None', value: 'none'},
        ],
        default: 'git',
      },
    ])
  }

  async configuring() {
    this.composeWith(require.resolve('../slicemachine'), {
      framework: 'nuxt',
      domain: this.domain,
      prismic: this.prismic,
      force: this.force,
      pm: this.answers.pm,
      ...this.options,
    })
  }

  async writing() {
    // template data to be passed to copyTmp
    const templateData: SaoTemplateData = saoSettings.templateData.bind(this)()

    this.outDir = this.destinationPath()

    const actions: Array<Action> = saoSettings.actions.bind(this)()

    // load the files into mem-fs
    actions.forEach(action => {
      switch (action.type) {
      case 'add': {
        if (action.files === 'package.json' && action.templateDir === this.outDir) {
          return
        }

        const {filters = {}} = action
        const ignore = Object.entries(filters).reduce((acc: Array<string>, [
          file,
          condition,
        ]) => {
          const pathToFile = path.join(action.templateDir, file)
          if (typeof condition === 'string') {
            const shouldIgnore = evaluate(condition, this.answers)
            return shouldIgnore ? acc : [...acc, pathToFile]
          }
          return condition ? [...acc, pathToFile] : acc
        }, ['**/nuxt/node_modules/**'])
        const fromPath = path.join(action.templateDir, action.files)
        return this.fs.copyTpl(
          fromPath,
          this.destinationPath(),
          {...this.answers, ...templateData},
          {},
          {globOptions: {ignore}},
        )
      }
      case 'move': {
        return Object.entries(action.patterns).forEach(([
          from,
          to,
        ]) => {
          this.existsDestination(from) && this.moveDestination(from, to)
        })
      }
      case 'modify': {
        if (!action.handler) return
        const files = (typeof action.files === 'string') ? [action.files] : [...action.files]

        return files.forEach(async fileName => {
          const isJson = fileName.endsWith('.json')
          const pathToFile = this.destinationPath(fileName)
          const content = isJson ? this.readDestinationJSON(fileName) : this.readDestination(fileName)
          const result = await action.handler(content, fileName)

          this.deleteDestination(fileName)
          if (isJson) {
            this.writeDestinationJSON(pathToFile, result, undefined, 2)
          } else {
            this.writeDestination(pathToFile, result)
          }
        })
      }
      case 'remove': {
        let patterns: string[] = []

        if (typeof action.files === 'string') {
          patterns = [action.files]
        } else if (Array.isArray(action.files)) {
          patterns = action.files
        } else if (typeof action.files === 'object') {
          patterns = Object.keys(action.files).reduce((acc: Array<string>, [file, condition]) => {
            if (typeof condition === 'string') {
              const shouldIgnore = evaluate(condition, this.answers)
              return shouldIgnore ? acc : [...acc, file]
            }
            return condition ? [...acc, file] : acc
          }, [])
        }
        return patterns.map(file => this.deleteDestination(file))
      }
      }
    })

    // doing the modifications see here: https://sao.vercel.app/saofile.html#actions
    // add: convert filters to https://github.com/mrmlnc/fast-glob#options-1 filters become ingore in the globOptions

    // NOTE: it would be much easier to add slicemachine as an option to nuxt
  }

  install() {
    if (this.answers.pm === 'yarn') {
      this.yarnInstall()
    } else {
      this.npmInstall()
    }
  }
}

interface AddAction {
  type: 'add';
  templateDir: string;
  files: string; // string[] | string;
  filters?: {
    [k: string]: string | boolean | null | undefined;
  };
  /** Transform the template with ejs */
  transform?: boolean;
  /**
   * Only transform files matching given minimatch patterns
   */
  transformInclude?: string[];
  /**
   * Don't transform files matching given minimatch patterns
   */
  transformExclude?: string;
  /**
   * Custom data to use in template transformation
   */
  data?: DataFunction | object;
}

type DataFunction = (this: any, context: any) => object
interface MoveAction {
  type: 'move';
  patterns: {
    [k: string]: string;
  };
}

interface ModifyAction {
  type: 'modify';
  files: string | string[];
  handler: (data: any, filepath: string) => any;
}

interface RemoveAction {
  type: 'remove';
  files: string | string[] | { [k: string]: string | boolean };
  when: boolean | string;
}

type Action = AddAction | MoveAction | ModifyAction | RemoveAction;
