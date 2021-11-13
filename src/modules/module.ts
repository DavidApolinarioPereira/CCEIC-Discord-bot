import YAML from 'yaml'
import fs from 'fs'

export class Module {
  public key: string = 'unknown'

  constructor (
    public readonly name: string,
    public readonly description: string,
    public readonly videoUri: string,
    public readonly formativeQuestions: Question[],
    public readonly evaluationQuestions: Question[],
    public readonly funFacts: string[],
    public readonly referencesLink: string
  ) { }

  /**
   * Load module from a file
   * @param path file path
   */
  static fromFile (path: string): Module {
    const file = fs.readFileSync(path, 'utf8')
    return YAML.parse(file) as Module
  }
}

export class Question {
  constructor (
    public readonly question: string,
    public readonly correctAnswers: string[],
    public readonly wrongAnswers: string[],
    public readonly feedbackForCorrect: string|undefined,
    public readonly feedbackForWrong: string|undefined
  ) { }
}
