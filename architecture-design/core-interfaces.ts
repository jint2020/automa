/**
 * 核心架构接口定义
 * 前端 DDD 重构 - 执行计划标准化
 */

// ============================================================================
// 1. 执行计划核心数据结构 (Workflow Execution Plan - WEP)
// ============================================================================

/**
 * 工作流执行计划 - 前端生成的标准 JSON 结构
 * 这是"UI 编排层"与"执行逻辑层"之间的契约
 */
export interface WorkflowExecutionPlan {
  /** 计划唯一标识 */
  id: string;
  /** 工作流名称 */
  name: string;
  /** 计划版本号 (用于向后兼容) */
  version: string;
  /** 生成时间戳 */
  createdAt: number;

  /** 执行配置 */
  config: ExecutionConfig;

  /** 执行步骤序列 (已编译为线性/树形结构) */
  steps: ExecutionStep[];

  /** 全局上下文数据 */
  context: ExecutionContext;

  /** 元数据 (用于调试、审计) */
  metadata: {
    sourceWorkflowId: string;
    compiler: string;
    compilerVersion: string;
  };
}

/**
 * 执行配置
 */
export interface ExecutionConfig {
  /** 执行模式 */
  mode: 'sequential' | 'parallel' | 'conditional';
  /** 错误处理策略 */
  onError: 'stop' | 'continue' | 'retry';
  /** 最大重试次数 */
  maxRetries?: number;
  /** 步骤间延迟 (ms) */
  stepDelay?: number;
  /** 超时时间 (ms) */
  timeout?: number;
  /** 是否保存执行日志 */
  saveLog: boolean;
}

/**
 * 执行上下文 - 跨步骤共享的状态
 */
export interface ExecutionContext {
  /** 全局变量 */
  variables: Record<string, any>;
  /** 数据表 */
  table: any[];
  /** 循环数据 */
  loopData: Record<string, any>;
  /** 用户定义的全局数据 */
  globalData: Record<string, any>;
}

// ============================================================================
// 2. 执行步骤定义 (Execution Step)
// ============================================================================

/**
 * 单个执行步骤 - 对应一个工作流节点
 */
export interface ExecutionStep {
  /** 步骤唯一标识 (对应节点 ID) */
  id: string;
  /** 步骤名称 */
  name: string;
  /** 步骤类型 (对应原 block 类型) */
  type: string;

  /** 要执行的动作 */
  action: ActionDescriptor;

  /** 执行条件 (可选) */
  condition?: ConditionExpression;

  /** 后续步骤路由 */
  next: NextStepRouter;

  /** 步骤配置 */
  config: {
    /** 是否可跳过 */
    skippable?: boolean;
    /** 超时时间 (覆盖全局配置) */
    timeout?: number;
    /** 重试策略 */
    retry?: RetryPolicy;
  };
}

/**
 * 动作描述符 - 核心抽象接口
 * 描述"要做什么"，而不是"怎么做"
 */
export interface ActionDescriptor {
  /** 动作类型 (如: navigate, click, type, extract, wait) */
  type: ActionType;

  /** 动作参数 (类型安全的联合类型) */
  payload: ActionPayload;

  /** 输出定义 - 定义此动作产生的数据 */
  output?: OutputDefinition;
}

/**
 * 动作类型枚举
 */
export enum ActionType {
  // 浏览器操作
  NAVIGATE = 'navigate',
  RELOAD = 'reload',
  GO_BACK = 'goBack',
  GO_FORWARD = 'goForward',
  CLOSE_TAB = 'closeTab',
  NEW_TAB = 'newTab',
  SWITCH_TAB = 'switchTab',

  // 元素交互
  CLICK = 'click',
  TYPE = 'type',
  SELECT = 'select',
  HOVER = 'hover',
  SCROLL = 'scroll',

  // 数据操作
  EXTRACT = 'extract',
  INSERT_DATA = 'insertData',
  DELETE_DATA = 'deleteData',
  SET_VARIABLE = 'setVariable',

  // 控制流
  WAIT = 'wait',
  CONDITION = 'condition',
  LOOP = 'loop',

  // 外部集成
  HTTP_REQUEST = 'httpRequest',
  EXECUTE_SCRIPT = 'executeScript',
  AI_WORKFLOW = 'aiWorkflow',
}

/**
 * 动作载荷 - 使用联合类型确保类型安全
 */
export type ActionPayload =
  | NavigatePayload
  | ClickPayload
  | TypePayload
  | ExtractPayload
  | WaitPayload
  | ConditionPayload
  | HttpRequestPayload
  | SetVariablePayload;

// ============================================================================
// 3. 具体动作载荷定义 (示例)
// ============================================================================

/**
 * 导航动作载荷
 */
export interface NavigatePayload {
  /** 目标 URL (支持模板变量 {{var}}) */
  url: string;
  /** 是否在新标签页打开 */
  newTab?: boolean;
  /** 等待加载策略 */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

/**
 * 点击动作载荷
 */
export interface ClickPayload {
  /** 元素选择器 */
  selector: ElementSelector;
  /** 点击类型 */
  clickType?: 'left' | 'right' | 'middle' | 'double';
  /** 点击前等待时间 */
  delay?: number;
  /** 是否模拟人类行为 */
  humanLike?: boolean;
}

/**
 * 输入动作载荷
 */
export interface TypePayload {
  /** 元素选择器 */
  selector: ElementSelector;
  /** 输入文本 (支持模板变量) */
  text: string;
  /** 输入延迟 (模拟打字速度) */
  delay?: number;
  /** 是否先清空 */
  clearBefore?: boolean;
}

/**
 * 数据提取载荷
 */
export interface ExtractPayload {
  /** 提取目标 */
  targets: ExtractTarget[];
  /** 是否提取多个元素 */
  multiple?: boolean;
  /** 数据处理管道 */
  pipeline?: DataTransform[];
}

/**
 * 等待动作载荷
 */
export interface WaitPayload {
  /** 等待类型 */
  type: 'time' | 'element' | 'condition' | 'navigation';
  /** 等待时长 (ms) */
  duration?: number;
  /** 等待的元素选择器 */
  selector?: ElementSelector;
  /** 等待的条件表达式 */
  condition?: string;
}

/**
 * 条件判断载荷
 */
export interface ConditionPayload {
  /** 条件表达式 (支持 JavaScript 表达式) */
  expression: string;
  /** 比较类型 */
  operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'regex';
  /** 比较值 */
  value?: any;
}

/**
 * HTTP 请求载荷
 */
export interface HttpRequestPayload {
  /** 请求方法 */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** 请求 URL */
  url: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体 */
  body?: any;
  /** 响应数据路径 (JSONPath) */
  dataPath?: string;
}

/**
 * 设置变量载荷
 */
export interface SetVariablePayload {
  /** 变量名 */
  name: string;
  /** 变量值 (支持模板) */
  value: any;
  /** 作用域 */
  scope?: 'local' | 'global';
}

// ============================================================================
// 4. 元素选择器抽象
// ============================================================================

/**
 * 元素选择器 - 统一的元素定位接口
 */
export interface ElementSelector {
  /** 选择器类型 */
  type: 'css' | 'xpath' | 'text' | 'id' | 'attr';
  /** 选择器值 */
  value: string;
  /** 是否支持 Shadow DOM 穿透 */
  pierceShadow?: boolean;
  /** iframe 路径 */
  iframe?: string;
  /** 等待元素出现 */
  waitFor?: number;
  /** 备选选择器 (fallback) */
  fallback?: ElementSelector[];
}

/**
 * 提取目标定义
 */
export interface ExtractTarget {
  /** 提取的数据键名 */
  key: string;
  /** 元素选择器 */
  selector: ElementSelector;
  /** 提取类型 */
  extract: 'text' | 'html' | 'attr' | 'href' | 'src' | 'value';
  /** 提取的属性名 (当 extract='attr' 时) */
  attrName?: string;
}

/**
 * 数据转换管道
 */
export interface DataTransform {
  type: 'trim' | 'replace' | 'regex' | 'jsonPath' | 'custom';
  config: Record<string, any>;
}

// ============================================================================
// 5. 条件与路由
// ============================================================================

/**
 * 条件表达式
 */
export interface ConditionExpression {
  /** 表达式字符串 (支持变量引用) */
  expression: string;
  /** 条件类型 */
  type?: 'simple' | 'javascript';
}

/**
 * 后续步骤路由
 */
export interface NextStepRouter {
  /** 默认下一步 */
  default?: string;
  /** 条件分支 */
  branches?: ConditionalBranch[];
  /** 失败处理 */
  onError?: string;
}

/**
 * 条件分支
 */
export interface ConditionalBranch {
  /** 分支条件 */
  condition: ConditionExpression;
  /** 目标步骤 ID */
  target: string;
}

/**
 * 重试策略
 */
export interface RetryPolicy {
  /** 最大重试次数 */
  maxAttempts: number;
  /** 重试延迟 (ms) */
  delay: number;
  /** 延迟增长策略 */
  backoff?: 'fixed' | 'exponential' | 'linear';
}

/**
 * 输出定义
 */
export interface OutputDefinition {
  /** 输出变量名 */
  variable: string;
  /** 输出路径 (用于嵌套数据) */
  path?: string;
  /** 数据转换 */
  transform?: DataTransform[];
}

// ============================================================================
// 6. 运行时适配器接口 (Runtime Adapter)
// ============================================================================

/**
 * 运行时适配器 - 执行环境的抽象接口
 * 不同的实现: MockRunner, ExtensionRunner, RemoteAgentRunner
 */
export interface RuntimeAdapter {
  /** 适配器名称 */
  readonly name: string;

  /** 适配器类型 */
  readonly type: 'mock' | 'extension' | 'remote' | 'hybrid';

  /**
   * 执行工作流
   * @param plan 执行计划
   * @returns 执行结果
   */
  execute(plan: WorkflowExecutionPlan): Promise<ExecutionResult>;

  /**
   * 执行单个动作
   * @param action 动作描述符
   * @param context 当前执行上下文
   * @returns 动作结果
   */
  executeAction(
    action: ActionDescriptor,
    context: ExecutionContext
  ): Promise<ActionResult>;

  /**
   * 暂停执行
   */
  pause(): Promise<void>;

  /**
   * 恢复执行
   */
  resume(): Promise<void>;

  /**
   * 停止执行
   */
  stop(): Promise<void>;

  /**
   * 获取执行状态
   */
  getStatus(): ExecutionStatus;

  /**
   * 订阅执行事件
   */
  on(event: ExecutionEvent, handler: EventHandler): void;
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  /** 执行是否成功 */
  success: boolean;
  /** 执行开始时间 */
  startedAt: number;
  /** 执行结束时间 */
  finishedAt: number;
  /** 执行步骤总数 */
  totalSteps: number;
  /** 成功步骤数 */
  successSteps: number;
  /** 失败步骤数 */
  failedSteps: number;
  /** 最终上下文 */
  context: ExecutionContext;
  /** 执行日志 */
  logs: ExecutionLog[];
  /** 错误信息 (如果失败) */
  error?: Error;
}

/**
 * 动作执行结果
 */
export interface ActionResult {
  /** 是否成功 */
  success: boolean;
  /** 输出数据 */
  data?: any;
  /** 错误信息 */
  error?: string;
  /** 执行耗时 (ms) */
  duration: number;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 执行状态
 */
export enum ExecutionStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STOPPED = 'stopped',
}

/**
 * 执行事件
 */
export type ExecutionEvent =
  | 'start'
  | 'step:start'
  | 'step:success'
  | 'step:error'
  | 'complete'
  | 'error'
  | 'pause'
  | 'resume'
  | 'stop';

/**
 * 事件处理器
 */
export type EventHandler = (data: any) => void;

/**
 * 执行日志
 */
export interface ExecutionLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  stepId?: string;
  message: string;
  data?: any;
}
