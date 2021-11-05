import { ModuleExecutionEnd, ModuleExecutionError, ModuleExecutionEvaluation, ModuleExecutionEvaluationPre, ModuleExecutionFormative, ModuleExecutionFormativeFeedback, ModuleExecutionStart } from './execution'

export abstract class ExecutionVisitor<T> {
  public abstract visitStart (e: ModuleExecutionStart): T
  public abstract visitFormative (e: ModuleExecutionFormative): T
  public abstract visitFormativeFeedback (e: ModuleExecutionFormativeFeedback): T
  public abstract visitEvaluationPre (e: ModuleExecutionEvaluationPre): T
  public abstract visitEvaluation (e: ModuleExecutionEvaluation): T
  public abstract visitEnd (e: ModuleExecutionEnd): T
  public abstract visitError (e: ModuleExecutionError): T
}
