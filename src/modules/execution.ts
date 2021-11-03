import { Module } from '.'
import { XORShift64 } from 'random-seedable'
import { CdrWriter } from '@foxglove/cdr'

export abstract class ModuleExecution {
  protected readonly module: Module
  private readonly rngSeed: number

  protected constructor (module: Module, rngSeed: number) {
    this.module = module
    this.rngSeed = rngSeed
  }

  static newForModule (module: Module): ModuleExecution {
    return new ModuleExecutionStarting(module, Math.random())
  }

  static deserialize (serialized: string) {
    // TODO
  }

  serialize (): string {
    const writer = new CdrWriter()
    writer.string(this.module.name)
    writer.int32(this.rngSeed)
    writer.int32(this.typeId())
    this.serializeInner(writer)
    return Buffer.from(writer.data).toString('base64')
  }

  protected abstract typeId (): number

  protected abstract serializeInner (writer: CdrWriter): void

  protected random (idx: number): number {
    const rng = new XORShift64(this.rngSeed)

    for (let i = 0; i < idx; i++) {
      rng.int()
    }

    return rng.int()
  }

  // TBD: methods to advance state machine
}

enum ModuleExecutionType {
  Starting = 0,
  Formative = 1,
  Evaluation = 2,
}

class ModuleExecutionStarting extends ModuleExecution {
  protected typeId (): number {
    return ModuleExecutionType.Starting
  }

  protected serializeInner (writer: CdrWriter) {}
}

class ModuleExecutionFormative extends ModuleExecution {
  private readonly questionNumber: number

  private constructor (module: Module, rngSeed: number, qn: number) {
    super(module, rngSeed)
    this.questionNumber = qn
  }

  protected typeId (): number {
    return ModuleExecutionType.Formative
  }

  protected serializeInner (writer: CdrWriter) {
    writer.int32(this.questionNumber)
  }
}

class ModuleExecutionEvaluation extends ModuleExecution {
  private readonly questionNumber: number
  private readonly score: number

  private constructor (module: Module, rngSeed: number, qn: number, s: number) {
    super(module, rngSeed)
    this.questionNumber = qn
    this.score = s
  }

  protected typeId (): number {
    return ModuleExecutionType.Evaluation
  }

  protected serializeInner (writer: CdrWriter) {
    writer.int32(this.questionNumber)
    writer.int32(this.score)
  }
}
