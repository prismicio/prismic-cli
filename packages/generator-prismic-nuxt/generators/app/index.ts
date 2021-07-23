import * as path from 'path'
import PrismicGenerator from '@prismicio/prismic-yeoman-generator'
import * as inquirer from 'inquirer'

const NuxtPrompts: Array<inquirer.Question> = require('create-nuxt-app/lib/prompts')

const saoSettings = require('create-nuxt-app/lib/saofile')

const evaluate = (exp: string, data: any): any => {
  /* eslint-disable no-new-func */
  /* eslint-disable no-console */
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
    const nuxtPrompts = NuxtPrompts.map(p => {
      if (p.name === 'name') return {...p, default: this.domain}
      // do the same for github user name
      if (p.name === 'gitUsername') return {...p, default: this.user.github.username}
      return p
    })
    const prompts = [...nuxtPrompts, {
      name: 'slicemachine',
      type: 'confirm',
      default: true,
      message: 'Slice Machine',
    }]

    this.answers = await inquirer.prompt(prompts)
  }

  async configuring() {
    this.config.set('framework', 'nuxt')
    const opts = {
      framework: 'nuxt',
      domain: this.domain,
      prismic: this.prismic,
      force: this.force,
      pm: this.answers.pm,
      ...this.options,
    }

    if (this.answers.slicemachine) {
      this.composeWith('prismic-nuxt:slicemachine', opts)
      this.composeWith('prismic-nuxt:create-slice', opts)
      this.composeWith('prismic-nuxt:storybook', opts)
    }
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

        const filters = action.filters || {}
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

    if (!this.options.slicemachine) {
      this.prismic.createRepository({
        domain: this.domain,
        framework: 'nuxt',
      }).then(res => {
        const url = new URL(this.prismic.base)
        url.host = `${res.data || this.domain}.${url.host}`
        this.log(`A new repository has been created at: ${url.toString()}`)
        return res
      })
    }
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
