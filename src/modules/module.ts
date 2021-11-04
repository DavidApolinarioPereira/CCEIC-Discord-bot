import YAML from 'yaml'
import fs from 'fs'

export class Module {
  constructor (
    public readonly name: string,
    public readonly videoUri: string,
    public readonly formativeQuestions: Question[],
    public readonly evaluationQuestions: Question[]
  ) { }

  /**
   * Load module from a file
   * @param path file path
   */
  static fromFile (path: string): Module {
    const file = fs.readFileSync(path, 'utf8')
    return YAML.parse(file) as Module
  }

  getScoreForRightAnswer (): number {
    return 1
  }

  getScoreForWrongAnswer (): number {
    return 0
  }
}

export class Question {
  constructor (
    public readonly question: string,
    public readonly correctAnswers: string[],
    public readonly wrongAnswers: string[],
    public readonly feedbackForCorrect: string,
    public readonly feedbackForWrong: string
  ) { }
}
