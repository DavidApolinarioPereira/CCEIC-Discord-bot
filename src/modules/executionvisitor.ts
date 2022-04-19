import { ModuleExecutionEnd, ModuleExecutionError, ModuleExecutionEvaluation, ModuleExecutionEvaluationPre, ModuleExecutionStart } from './execution.js'

export abstract class ExecutionVisitor<T> {
  public abstract visitStart(e: ModuleExecutionStart): T
  public abstract visitEvaluationPre(e: ModuleExecutionEvaluationPre): T
  public abstract visitEvaluation(e: ModuleExecutionEvaluation): T
  public abstract visitEnd(e: ModuleExecutionEnd): T
  public abstract visitError(e: ModuleExecutionError): T
}
