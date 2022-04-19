import { Module, ModuleRegistry, Question } from './index.js'
import { XORShift64 } from 'random-seedable'
import { CdrReader, CdrWriter } from '@foxglove/cdr'
import { ExecutionVisitor } from './executionvisitor.js'
import { randomBytes } from 'crypto'

export abstract class ModuleExecution {
  public readonly module: Module
  protected readonly rngSeed: number

  constructor(module: Module, rngSeed: number | null = null) {
    this.module = module
    this.rngSeed = rngSeed ?? randomBytes(4).readUInt32BE(0)
  }

  static newForModule(module: Module): ModuleExecutionStart {
    return new ModuleExecutionStart(module)
  }

  static deserialize(serialized: string, registry: ModuleRegistry): ModuleExecution {
    const buf = Buffer.from(serialized, 'base64')
    const reader = new CdrReader(buf)
    const module = registry.get(reader.string())
    const seed = reader.int32()
    const typeId = reader.int8()

    let qn, r, s, msg
    switch (typeId) {
      case ModuleExecutionType.Start:
        return new ModuleExecutionStart(module, seed)
      case ModuleExecutionType.EvaluationPre:
        return new ModuleExecutionEvaluationPre(module, seed)
      case ModuleExecutionType.Evaluation:
        qn = reader.int8()
        s = reader.float64()
        return new ModuleExecutionEvaluation(module, seed, qn, s)
      case ModuleExecutionType.End:
        s = reader.float64()
        return new ModuleExecutionEnd(module, s)
      case ModuleExecutionType.Error:
        msg = reader.string()
        return new ModuleExecutionError(module, msg)
      default:
        throw new Error('unknown execution state')
    }
  }

  serialize(): string {
    const writer = new CdrWriter()
    writer.string(this.module.key)
    writer.int32(this.rngSeed)
    writer.int8(this.typeId())
    this.serializeInner(writer)
    return Buffer.from(writer.data).toString('base64')
  }

  protected abstract typeId(): number

  protected abstract serializeInner(writer: CdrWriter): void

  protected random(idx: number): number {
    const rng = new XORShift64(this.rngSeed)

    for (let i = 0; i < idx; i++) {
      rng.int()
    }

    return rng.int()
  }

  /**
   * Consumes the current state, the user interaction and returns the new state
   * @param actionId id of the selected option/pressed button
   */
  public abstract advance(actionId: string): ModuleExecution

  public abstract accept<T>(visitor: ExecutionVisitor<T>): T
}

enum ModuleExecutionType {
  Start = 0,
  EvaluationPre,
  Evaluation,
  End,
  Error,
}

export class ModuleExecutionStart extends ModuleExecution {
  protected typeId(): number {
    return ModuleExecutionType.Start
  }

  protected serializeInner(writer: CdrWriter): void { }

  public advance(actionId: string): ModuleExecution {
    return new ModuleExecutionEvaluationPre(this.module)
  }

  public accept<T>(visitor: ExecutionVisitor<T>): T {
    return visitor.visitStart(this)
  }
}

export enum AnswerAction {
  Correct = 'c',
  Incorrect = 'w',
}

export class ModuleExecutionEvaluationPre extends ModuleExecution {
  protected typeId(): number {
    return ModuleExecutionType.EvaluationPre
  }

  protected serializeInner(writer: CdrWriter): void { }

  public advance(actionId: string): ModuleExecution {
    switch (actionId) {
      case EvaluationPreActions.Continue:
        return new ModuleExecutionEvaluation(this.module)
      case EvaluationPreActions.Restart:
        return new ModuleExecutionStart(this.module)
      default:
        return new ModuleExecutionError(this.module, 'bad action id')
    }
  }

  public accept<T>(visitor: ExecutionVisitor<T>): T {
    return visitor.visitEvaluationPre(this)
  }
}

export enum EvaluationPreActions {
  Continue = 'c',
  Restart = 'r',
}

export class ModuleExecutionEvaluation extends ModuleExecution {
  public readonly questionNumber: number
  public readonly score: number

  constructor(module: Module, rngSeed: number | null = null, qn: number = 0, s: number = 0) {
    super(module, rngSeed)
    this.questionNumber = qn
    this.score = s
  }

  protected typeId(): number {
    return ModuleExecutionType.Evaluation
  }

  protected serializeInner(writer: CdrWriter): void {
    writer.int8(this.questionNumber)
    writer.float64(this.score)
  }

  public question(): Question {
    // TODO: remove repetitive code
    const questions = [...this.module.evaluationQuestions]

    // remove previous questions from pool
    let trueIdx: number
    for (let idx = 0; idx < this.questionNumber; idx++) {
      trueIdx = this.random(idx) % questions.length
      questions.splice(trueIdx, 1)
    }

    // show next one
    return questions[this.random(this.questionNumber) % questions.length]
  }

  public advance(actionId: string): ModuleExecution {
    const nextQid = this.questionNumber + 1
    const newScore = this.score + (this.isRightAnswer(actionId) ? 1 : 0)

    if (nextQid < this.module.evaluationQuestions.length) {
      return new ModuleExecutionEvaluation(this.module, this.rngSeed, nextQid, newScore)
    } else {
      return new ModuleExecutionEnd(this.module, newScore)
    }
  }

  private isRightAnswer(actionId: string): boolean {
    // HACK: students can probably find the answer easily, enough for this tho :/
    return actionId === AnswerAction.Correct
  }

  public accept<T>(visitor: ExecutionVisitor<T>): T {
    return visitor.visitEvaluation(this)
  }
}

export class ModuleExecutionEnd extends ModuleExecution {
  public readonly score: number

  constructor(module: Module, score: number) {
    super(module)
    this.score = score
  }

  protected typeId(): number {
    return ModuleExecutionType.End
  }

  protected serializeInner(writer: CdrWriter): void {
    writer.float64(this.score)
  }

  public advance(actionId: string): ModuleExecution {
    switch (actionId) {
      case EndAction.RestartEvaluation:
        return new ModuleExecutionEvaluationPre(this.module)
      case EndAction.RestartModule:
        return new ModuleExecutionStart(this.module)
      default:
        return new ModuleExecutionError(this.module, 'bad action id')
    }
  }

  public accept<T>(visitor: ExecutionVisitor<T>): T {
    return visitor.visitEnd(this)
  }
}

export enum EndAction {
  RestartModule = 'm',
  RestartEvaluation = 'e',
}

export class ModuleExecutionError extends ModuleExecution {
  public readonly message: string

  constructor(module: Module, msg: string) {
    super(module)
    this.message = msg
  }

  protected typeId(): number {
    return ModuleExecutionType.Error
  }

  protected serializeInner(writer: CdrWriter): void {
    writer.string(this.message)
  }

  public advance(_actionId: string): ModuleExecution {
    return this
  }

  public accept<T>(visitor: ExecutionVisitor<T>): T {
    return visitor.visitError(this)
  }
}
