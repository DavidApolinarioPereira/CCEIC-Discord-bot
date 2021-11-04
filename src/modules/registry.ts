import { Module } from './module'
import fs from 'fs'


export class ModuleRegistry {
  private readonly _modules: {[name: string]: Module} = {}

  /**
     * Loads all modules from a directory into a new registry
     */
  static fromDirectory (path: string): ModuleRegistry {
    const reg = new ModuleRegistry()

    const file_names = fs.readdirSync(path)
    for (const file_name of file_names) {
      const module = Module.fromFile(path + "/" + file_name)
      reg._modules[module.name] = module
    }
    
    return reg
  }

  /**
     * Get a module from the registry
     * @param name module name
     */
  get (name: string): Module {
    return this._modules[name]
  }
}
