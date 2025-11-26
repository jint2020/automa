/**
 * Mock Runner - 模拟执行器完整实现
 * 用于在没有真实后端的情况下，在控制台模拟工作流执行
 */

import {
  RuntimeAdapter,
  WorkflowExecutionPlan,
  ExecutionResult,
  ExecutionContext,
  ExecutionStatus,
  ExecutionEvent,
  EventHandler,
  ExecutionLog,
  ExecutionStep,
  ActionDescriptor,
  ActionResult,
  ActionType,
} from './core-interfaces';

/**
 * Mock 运行时适配器
 * 完全在前端运行，通过控制台输出模拟执行过程
 */
export class MockRuntimeAdapter implements RuntimeAdapter {
  readonly name = 'MockRunner';
  readonly type = 'mock' as const;

  private status: ExecutionStatus = ExecutionStatus.IDLE;
  private currentPlan: WorkflowExecutionPlan | null = null;
  private context: ExecutionContext | null = null;
  private logs: ExecutionLog[] = [];
  private eventHandlers: Map<ExecutionEvent, EventHandler[]> = new Map();
  private isPaused = false;
  private shouldStop = false;

  // ============================================================================
  // 公共接口实现
  // ============================================================================

  /**
   * 执行工作流
   */
  async execute(plan: WorkflowExecutionPlan): Promise<ExecutionResult> {
    console.clear();
    console.log(
      '%c🚀 Mock Runner Started',
      'font-size: 20px; font-weight: bold; color: #4ecdc4;'
    );
    console.log('━'.repeat(80));

    const startTime = Date.now();
    this.currentPlan = plan;
    this.context = { ...plan.context };
    this.status = ExecutionStatus.RUNNING;
    this.logs = [];
    this.shouldStop = false;

    this.emit('start', { plan });
    this.log('info', `Starting workflow: ${plan.name}`);

    let successCount = 0;
    let failedCount = 0;
    let lastError: Error | undefined;

    try {
      // 打印执行计划概览
      this.printPlanOverview(plan);

      // 执行所有步骤
      for (let i = 0; i < plan.steps.length; i++) {
        if (this.shouldStop) {
          this.log('info', 'Execution stopped by user');
          break;
        }

        const step = plan.steps[i];

        // 等待暂停恢复
        await this.waitIfPaused();

        // 执行步骤
        const stepResult = await this.executeStep(step, i + 1, plan.steps.length);

        if (stepResult.success) {
          successCount++;
        } else {
          failedCount++;
          lastError = new Error(stepResult.error);

          // 根据错误处理策略决定是否继续
          if (plan.config.onError === 'stop') {
            this.log('error', 'Stopping execution due to error');
            break;
          }
        }

        // 步骤间延迟
        if (plan.config.stepDelay && i < plan.steps.length - 1) {
          await this.sleep(plan.config.stepDelay);
        }
      }

      // 执行完成
      this.status = this.shouldStop
        ? ExecutionStatus.STOPPED
        : failedCount > 0
        ? ExecutionStatus.FAILED
        : ExecutionStatus.COMPLETED;

      const result: ExecutionResult = {
        success: failedCount === 0 && !this.shouldStop,
        startedAt: startTime,
        finishedAt: Date.now(),
        totalSteps: plan.steps.length,
        successSteps: successCount,
        failedSteps: failedCount,
        context: this.context!,
        logs: this.logs,
        error: lastError,
      };

      this.printExecutionSummary(result);
      this.emit('complete', result);

      return result;
    } catch (error) {
      this.status = ExecutionStatus.FAILED;
      this.log('error', `Fatal error: ${error.message}`);

      const result: ExecutionResult = {
        success: false,
        startedAt: startTime,
        finishedAt: Date.now(),
        totalSteps: plan.steps.length,
        successSteps: successCount,
        failedSteps: failedCount + 1,
        context: this.context!,
        logs: this.logs,
        error: error,
      };

      this.emit('error', { error, result });
      return result;
    }
  }

  /**
   * 执行单个动作
   */
  async executeAction(
    action: ActionDescriptor,
    context: ExecutionContext
  ): Promise<ActionResult> {
    this.context = context;

    // 根据动作类型分发到对应的模拟执行器
    switch (action.type) {
      case ActionType.NAVIGATE:
        return this.mockNavigate(action);
      case ActionType.CLICK:
        return this.mockClick(action);
      case ActionType.TYPE:
        return this.mockType(action);
      case ActionType.EXTRACT:
        return this.mockExtract(action);
      case ActionType.WAIT:
        return this.mockWait(action);
      case ActionType.CONDITION:
        return this.mockCondition(action);
      case ActionType.HTTP_REQUEST:
        return this.mockHttpRequest(action);
      case ActionType.SET_VARIABLE:
        return this.mockSetVariable(action);
      default:
        return {
          success: false,
          error: `Unsupported action type: ${action.type}`,
          duration: 0,
        };
    }
  }

  async pause(): Promise<void> {
    this.isPaused = true;
    this.status = ExecutionStatus.PAUSED;
    this.log('info', '⏸️  Execution paused');
    this.emit('pause', {});
  }

  async resume(): Promise<void> {
    this.isPaused = false;
    this.status = ExecutionStatus.RUNNING;
    this.log('info', '▶️  Execution resumed');
    this.emit('resume', {});
  }

  async stop(): Promise<void> {
    this.shouldStop = true;
    this.status = ExecutionStatus.STOPPED;
    this.log('info', '⏹️  Execution stopped');
    this.emit('stop', {});
  }

  getStatus(): ExecutionStatus {
    return this.status;
  }

  on(event: ExecutionEvent, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  // ============================================================================
  // 私有方法 - 步骤执行
  // ============================================================================

  private async executeStep(
    step: ExecutionStep,
    index: number,
    total: number
  ): Promise<ActionResult> {
    console.log('\n' + '─'.repeat(80));
    console.log(
      `%c📍 Step ${index}/${total}: ${step.name}`,
      'font-size: 14px; font-weight: bold; color: #ffd93d;'
    );
    console.log('─'.repeat(80));

    this.emit('step:start', { step, index });
    this.log('info', `Executing step: ${step.name}`, step.id);

    // 检查执行条件
    if (step.condition) {
      const conditionMet = this.evaluateCondition(step.condition.expression);
      if (!conditionMet) {
        console.log('⏭️  Step skipped (condition not met)');
        return { success: true, data: { skipped: true }, duration: 0 };
      }
    }

    const startTime = Date.now();

    try {
      // 执行动作
      const result = await this.executeAction(step.action, this.context!);

      // 处理输出
      if (result.success && step.action.output) {
        const { variable, path } = step.action.output;
        const value = path ? this.getNestedValue(result.data, path) : result.data;
        this.context!.variables[variable] = value;
        console.log(`📤 Output saved to variable: ${variable} =`, value);
      }

      result.duration = Date.now() - startTime;

      if (result.success) {
        this.emit('step:success', { step, result });
        this.log('info', `Step completed: ${step.name}`, step.id);
      } else {
        this.emit('step:error', { step, error: result.error });
        this.log('error', `Step failed: ${result.error}`, step.id);
      }

      return result;
    } catch (error) {
      const result: ActionResult = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };

      this.emit('step:error', { step, error });
      this.log('error', `Step error: ${error.message}`, step.id);

      return result;
    }
  }

  // ============================================================================
  // 私有方法 - 动作模拟器
  // ============================================================================

  private async mockNavigate(action: ActionDescriptor): Promise<ActionResult> {
    const payload = action.payload as any;
    console.group('🌐 Navigate');
    console.log('URL:', payload.url);
    console.log('Wait Until:', payload.waitUntil || 'load');
    console.log('New Tab:', payload.newTab || false);

    await this.sleep(800);
    console.log('✅ Page loaded');
    console.groupEnd();

    return {
      success: true,
      data: { url: payload.url, status: 'loaded' },
      duration: 800,
    };
  }

  private async mockClick(action: ActionDescriptor): Promise<ActionResult> {
    const payload = action.payload as any;
    console.group('🖱️  Click');
    console.log('Selector:', payload.selector.value);
    console.log('Click Type:', payload.clickType || 'left');

    await this.sleep(300);
    console.log('✅ Element clicked');
    console.groupEnd();

    return {
      success: true,
      data: { clicked: true, selector: payload.selector.value },
      duration: 300,
    };
  }

  private async mockType(action: ActionDescriptor): Promise<ActionResult> {
    const payload = action.payload as any;
    const text = this.interpolateVariables(payload.text);

    console.group('⌨️  Type');
    console.log('Selector:', payload.selector.value);
    console.log('Text:', text);
    console.log('Clear Before:', payload.clearBefore || false);

    const typingTime = text.length * 50;
    await this.sleep(typingTime);
    console.log('✅ Text typed');
    console.groupEnd();

    return {
      success: true,
      data: { typed: text },
      duration: typingTime,
    };
  }

  private async mockExtract(action: ActionDescriptor): Promise<ActionResult> {
    const payload = action.payload as any;
    console.group('📊 Extract Data');
    console.log('Targets:', payload.targets);
    console.log('Multiple:', payload.multiple || false);

    await this.sleep(500);

    // 模拟提取的数据
    const extractedData: any = {};
    payload.targets.forEach((target: any) => {
      extractedData[target.key] = `[Mock] ${target.extract} from ${target.selector.value}`;
    });

    console.log('Extracted Data:', extractedData);
    console.log('✅ Data extracted');
    console.groupEnd();

    return {
      success: true,
      data: extractedData,
      duration: 500,
    };
  }

  private async mockWait(action: ActionDescriptor): Promise<ActionResult> {
    const payload = action.payload as any;
    console.group('⏳ Wait');
    console.log('Type:', payload.type);

    if (payload.type === 'time') {
      console.log('Duration:', `${payload.duration}ms`);
      await this.sleep(payload.duration);
    } else if (payload.type === 'element') {
      console.log('Wait for element:', payload.selector?.value);
      await this.sleep(1000);
    }

    console.log('✅ Wait completed');
    console.groupEnd();

    return {
      success: true,
      data: { waited: true },
      duration: payload.duration || 1000,
    };
  }

  private async mockCondition(action: ActionDescriptor): Promise<ActionResult> {
    const payload = action.payload as any;
    console.group('🔀 Condition');
    console.log('Expression:', payload.expression);

    const result = this.evaluateCondition(payload.expression);
    console.log('Result:', result);
    console.groupEnd();

    return {
      success: true,
      data: { result },
      duration: 10,
    };
  }

  private async mockHttpRequest(action: ActionDescriptor): Promise<ActionResult> {
    const payload = action.payload as any;
    console.group('🌐 HTTP Request');
    console.log('Method:', payload.method);
    console.log('URL:', payload.url);
    console.log('Headers:', payload.headers);

    await this.sleep(600);

    const mockResponse = {
      status: 200,
      data: { message: '[Mock] API Response', timestamp: Date.now() },
    };

    console.log('Response:', mockResponse);
    console.log('✅ Request completed');
    console.groupEnd();

    return {
      success: true,
      data: mockResponse.data,
      duration: 600,
    };
  }

  private async mockSetVariable(action: ActionDescriptor): Promise<ActionResult> {
    const payload = action.payload as any;
    const value = this.interpolateVariables(payload.value);

    console.group('💾 Set Variable');
    console.log('Name:', payload.name);
    console.log('Value:', value);
    console.log('Scope:', payload.scope || 'local');

    this.context!.variables[payload.name] = value;

    console.log('✅ Variable set');
    console.groupEnd();

    return {
      success: true,
      data: { [payload.name]: value },
      duration: 5,
    };
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async waitIfPaused(): Promise<void> {
    while (this.isPaused) {
      await this.sleep(100);
    }
  }

  private log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    stepId?: string
  ): void {
    const log: ExecutionLog = {
      timestamp: Date.now(),
      level,
      stepId,
      message,
    };
    this.logs.push(log);
  }

  private emit(event: ExecutionEvent, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => handler(data));
  }

  private evaluateCondition(expression: string): boolean {
    try {
      // 简单的表达式求值 (生产环境应使用安全的表达式引擎)
      const interpolated = this.interpolateVariables(expression);
      return eval(interpolated);
    } catch {
      return false;
    }
  }

  private interpolateVariables(text: string): any {
    if (typeof text !== 'string') return text;

    // 替换 {{variable}} 模板
    return text.replace(/\{\{(.+?)\}\}/g, (_, varName) => {
      const value = this.context!.variables[varName.trim()];
      return value !== undefined ? value : `{{${varName}}}`;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  private printPlanOverview(plan: WorkflowExecutionPlan): void {
    console.group('📋 Execution Plan Overview');
    console.table({
      Name: plan.name,
      Version: plan.version,
      'Total Steps': plan.steps.length,
      Mode: plan.config.mode,
      'On Error': plan.config.onError,
      'Step Delay': `${plan.config.stepDelay || 0}ms`,
    });
    console.log('Initial Context:', plan.context);
    console.groupEnd();
  }

  private printExecutionSummary(result: ExecutionResult): void {
    console.log('\n' + '━'.repeat(80));
    console.log(
      `%c${result.success ? '✅' : '❌'} Execution ${result.success ? 'Completed' : 'Failed'}`,
      `font-size: 18px; font-weight: bold; color: ${result.success ? '#51cf66' : '#ff6b6b'};`
    );
    console.log('━'.repeat(80));

    console.group('📊 Execution Summary');
    console.table({
      Status: result.success ? 'SUCCESS' : 'FAILED',
      'Total Steps': result.totalSteps,
      'Success Steps': result.successSteps,
      'Failed Steps': result.failedSteps,
      Duration: `${result.finishedAt - result.startedAt}ms`,
    });

    console.log('Final Context:', result.context);

    if (result.error) {
      console.error('Error:', result.error);
    }

    console.groupEnd();

    console.group('📜 Execution Logs');
    result.logs.forEach((log) => {
      const icon = { info: 'ℹ️', warn: '⚠️', error: '❌', debug: '🐛' }[log.level];
      const time = new Date(log.timestamp).toLocaleTimeString();
      console.log(`${icon} [${time}] ${log.message}`);
    });
    console.groupEnd();
  }
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * 示例：完整的工作流执行
 */
export async function runMockWorkflowExample() {
  const plan: WorkflowExecutionPlan = {
    id: 'wf-demo-001',
    name: 'Login and Extract User Info',
    version: '1.0.0',
    createdAt: Date.now(),
    config: {
      mode: 'sequential',
      onError: 'stop',
      stepDelay: 1000,
      timeout: 30000,
      saveLog: true,
    },
    steps: [
      {
        id: 'step-1',
        name: 'Navigate to Login Page',
        type: 'navigate',
        action: {
          type: ActionType.NAVIGATE,
          payload: {
            url: 'https://example.com/login',
            waitUntil: 'load',
          },
        },
        next: { default: 'step-2' },
        config: {},
      },
      {
        id: 'step-2',
        name: 'Type Username',
        type: 'type',
        action: {
          type: ActionType.TYPE,
          payload: {
            selector: { type: 'css', value: '#username' },
            text: '{{username}}',
            clearBefore: true,
          },
        },
        next: { default: 'step-3' },
        config: {},
      },
      {
        id: 'step-3',
        name: 'Type Password',
        type: 'type',
        action: {
          type: ActionType.TYPE,
          payload: {
            selector: { type: 'css', value: '#password' },
            text: '{{password}}',
            clearBefore: true,
          },
        },
        next: { default: 'step-4' },
        config: {},
      },
      {
        id: 'step-4',
        name: 'Click Login Button',
        type: 'click',
        action: {
          type: ActionType.CLICK,
          payload: {
            selector: { type: 'css', value: '#login-button' },
            clickType: 'left',
            humanLike: true,
          },
        },
        next: { default: 'step-5' },
        config: {},
      },
      {
        id: 'step-5',
        name: 'Wait for Dashboard',
        type: 'wait',
        action: {
          type: ActionType.WAIT,
          payload: {
            type: 'element',
            selector: { type: 'css', value: '.dashboard' },
          },
        },
        next: { default: 'step-6' },
        config: {},
      },
      {
        id: 'step-6',
        name: 'Extract User Info',
        type: 'extract',
        action: {
          type: ActionType.EXTRACT,
          payload: {
            targets: [
              {
                key: 'userName',
                selector: { type: 'css', value: '.user-name' },
                extract: 'text',
              },
              {
                key: 'userEmail',
                selector: { type: 'css', value: '.user-email' },
                extract: 'text',
              },
            ],
            multiple: false,
          },
          output: {
            variable: 'userInfo',
          },
        },
        next: { default: null },
        config: {},
      },
    ],
    context: {
      variables: {
        username: 'demo@example.com',
        password: 'SecurePass123!',
      },
      table: [],
      loopData: {},
      globalData: {},
    },
    metadata: {
      sourceWorkflowId: 'wf-demo-001',
      compiler: 'AutomaWebCompiler',
      compilerVersion: '2.0.0',
    },
  };

  // 创建 Mock Runner
  const runner = new MockRuntimeAdapter();

  // 订阅事件
  runner.on('start', () => console.log('🎬 Workflow started'));
  runner.on('step:start', (data) => console.log('▶️  Step started:', data.step.name));
  runner.on('complete', (result) =>
    console.log('🏁 Workflow completed:', result.success)
  );

  // 执行工作流
  const result = await runner.execute(plan);

  return result;
}

// 在浏览器控制台中运行
if (typeof window !== 'undefined') {
  (window as any).runMockWorkflow = runMockWorkflowExample;
  console.log('💡 Run: runMockWorkflow() to see the Mock Runner in action');
}
