import { Module } from './module.js'
import fs from 'fs'

export class ModuleRegistry {
  private readonly modules: {[key: string]: Module} = {}

  /**
     * Loads all modules from a directory into a new registry
     */
  static fromDirectory (path: string): ModuleRegistry {
    const reg = new ModuleRegistry()

    const fileNames = fs.readdirSync(path)
    for (const fileName of fileNames) {
      const module = Module.fromFile(path + '/' + fileName)
      module.key = fileName
      reg.modules[fileName] = module
    }

    return reg
  }

  /**
     * Get a module from the registry
     * @param key module key
     */
  get (key: string): Module {
    return this.modules[key]
  }

  entries (): Array<[string, Module]> {
    return Object.entries(this.modules)
  }
}
