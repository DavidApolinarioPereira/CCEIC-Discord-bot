import { Module } from './module.js'
import fs from 'fs'


export class ModuleRegistry {
  private readonly _modules: {[key: string]: Module} = {}

  /**
     * Loads all modules from a directory into a new registry
     */
  static fromDirectory (path: string): ModuleRegistry {
    const reg = new ModuleRegistry()

    const file_names = fs.readdirSync(path)
    for (const file_name of file_names) {
      const module = Module.fromFile(path + "/" + file_name)
      module.key = file_name
      reg._modules[file_name] = module
    }
    
    return reg
  }

  /**
     * Get a module from the registry
     * @param key module key
     */
  get (key: string): Module {
    return this._modules[key]
  }

  entries(): [string, Module][] {
    return Object.entries(this._modules)
  }
}
