import { promises as fs } from 'fs'
import { rm } from 'shelljs'

import Config, { read, write } from '../config'
const readFile = fs.readFile

describe('utils/config', () => {
  beforeEach(() => {
    rm('-f', Config.defaults.configFilePath())
  })

  afterAll(() => {
    rm('-f', Config.defaults.configFilePath())
  })

  describe('write()', () => {
    it('should write a configuration file', async () => {
      await write(`{
        "hello": "world"
      }`)
      const content = await readFile(Config.defaults.configFilePath(), 'utf-8')
      expect(JSON.parse(content)).toEqual({ hello: 'world' })
    })
  })

  describe('read()', () => {
    it('should read a configuration file', async () => {
      await write(`{
        "hello": "world"
      }`)
      const content = await read()
      expect(JSON.parse(content)).toEqual({ hello: 'world' })
    })
  })

  describe('set()', () => {
    it('should set a configuration value', async () => {
      await Config.set({ hello: 'world' })
      expect(JSON.parse(await readFile(Config.defaults.configFilePath(), 'utf-8'))).toEqual({
        hello: 'world'
      })
    })
  })

  describe('get()', () => {
    it('should get a configuration value', async () => {
      await Config.set({ hello: 'world' })
      const world = await Config.get('hello')
      expect(world).toEqual('world')
    })
  })
})
