import { Module } from './module'

export class ModuleRegistry {
  private readonly _modules: {[name: string]: Module} = {}

  /**
     * Loads all modules from a directory into a new registry
     */
  static fromDirectory (path: string): ModuleRegistry {
    // TODO: load all modules from dir (or file, dir would be cool, whatever is easier)
    return {} as ModuleRegistry
  }

  /**
     * Get a module from the registry
     * @param name module name
     */
  get (name: string): Module {
    // TODO
    return {} as Module
  }
}
