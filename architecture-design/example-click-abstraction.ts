/**
 * 示例：点击元素的抽象化
 * 对比插件模式 vs Web 架构模式
 */

import {
  ActionDescriptor,
  ActionType,
  ClickPayload,
  ElementSelector,
  RuntimeAdapter,
  ExecutionContext,
  ActionResult,
} from './core-interfaces';

// ============================================================================
// 旧代码：插件模式 - 直接调用 Chrome API
// ============================================================================

/**
 * Automa 原始实现 (简化版)
 * 位置: src/workflowEngine/blocksHandler/handlerClick.js
 */
export class OldClickHandler {
  async execute(blockData: any, helpers: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // 1. 直接在 content script 中查找元素
      const element = document.querySelector(blockData.data.selector);

      if (!element) {
        reject(new Error('Element not found'));
        return;
      }

      // 2. 直接操作 DOM
      element.click();

      // 3. 返回结果
      resolve({ data: 'clicked' });
    });
  }
}

// ============================================================================
// 新架构：Web 模式 - 生成标准动作描述符
// ============================================================================

/**
 * Step 1: 工作流编译器 - 将节点转换为动作描述符
 */
export class ClickActionCompiler {
  /**
   * 将 UI 节点编译为标准的 ActionDescriptor
   */
  compile(nodeData: any): ActionDescriptor {
    // 从 UI 节点提取配置
    const { selector, clickType, delay, humanLike } = nodeData;

    // 构建元素选择器
    const elementSelector: ElementSelector = {
      type: selector.type || 'css',
      value: selector.value,
      pierceShadow: selector.pierceShadow || false,
      waitFor: selector.waitFor || 5000,
    };

    // 构建点击载荷
    const payload: ClickPayload = {
      selector: elementSelector,
      clickType: clickType || 'left',
      delay: delay || 0,
      humanLike: humanLike || false,
    };

    // 返回标准化的动作描述符
    return {
      type: ActionType.CLICK,
      payload,
      output: {
        variable: 'lastClickResult',
        path: 'success',
      },
    };
  }
}

/**
 * Step 2: Mock Runner - 模拟执行点击动作
 */
export class MockClickExecutor {
  async execute(
    action: ActionDescriptor,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const payload = action.payload as ClickPayload;

    console.group('🖱️  [Mock] Execute Click Action');
    console.log('Selector:', payload.selector);
    console.log('Click Type:', payload.clickType);
    console.log('Current Context:', context);

    // 模拟延迟
    if (payload.delay) {
      console.log(`⏳ Waiting ${payload.delay}ms before click...`);
      await this.sleep(payload.delay);
    }

    // 模拟查找元素
    console.log(`🔍 Finding element: ${payload.selector.value}`);
    await this.sleep(500); // 模拟查找时间

    // 模拟点击
    if (payload.humanLike) {
      console.log('👆 Simulating human-like click (with mouse movement)');
      await this.sleep(300);
    } else {
      console.log('⚡ Performing instant click');
    }

    console.log('✅ Click executed successfully');
    console.groupEnd();

    return {
      success: true,
      data: {
        clicked: true,
        selector: payload.selector.value,
        timestamp: Date.now(),
      },
      duration: payload.delay || 0 + 500 + (payload.humanLike ? 300 : 0),
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Step 3: 插件执行器 - 实际调用 Chrome API
 */
export class ExtensionClickExecutor {
  async execute(
    action: ActionDescriptor,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const payload = action.payload as ClickPayload;
    const startTime = Date.now();

    try {
      // 1. 向 content script 发送消息
      const result = await chrome.tabs.sendMessage(context.variables.tabId, {
        type: 'EXECUTE_CLICK',
        payload: {
          selector: payload.selector,
          clickType: payload.clickType,
          delay: payload.delay,
        },
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * Step 4: 远程代理执行器 - 发送到后端/桌面 Agent
 */
export class RemoteClickExecutor {
  constructor(private apiEndpoint: string) {}

  async execute(
    action: ActionDescriptor,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const payload = action.payload as ClickPayload;
    const startTime = Date.now();

    try {
      // 发送到远程执行器
      const response = await fetch(`${this.apiEndpoint}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          context: {
            sessionId: context.variables.sessionId,
            tabId: context.variables.tabId,
          },
        }),
      });

      const result = await response.json();

      return {
        success: result.success,
        data: result.data,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
}

// ============================================================================
// 统一的执行器工厂
// ============================================================================

export class ActionExecutorFactory {
  /**
   * 根据环境创建对应的执行器
   */
  static createClickExecutor(
    runtime: 'mock' | 'extension' | 'remote',
    config?: any
  ) {
    switch (runtime) {
      case 'mock':
        return new MockClickExecutor();
      case 'extension':
        return new ExtensionClickExecutor();
      case 'remote':
        return new RemoteClickExecutor(config.apiEndpoint);
      default:
        throw new Error(`Unknown runtime: ${runtime}`);
    }
  }
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * 示例 1: 从 UI 到执行计划
 */
export async function example1_UIToExecutionPlan() {
  // 1. UI 层：用户在可视化编辑器中配置的节点数据
  const uiNodeData = {
    id: 'node-123',
    type: 'click',
    selector: {
      type: 'css',
      value: '#submit-button',
      waitFor: 3000,
    },
    clickType: 'left',
    delay: 500,
    humanLike: true,
  };

  // 2. 编译器：将 UI 节点转换为标准 ActionDescriptor
  const compiler = new ClickActionCompiler();
  const action = compiler.compile(uiNodeData);

  console.log('📋 Generated Action Descriptor:');
  console.log(JSON.stringify(action, null, 2));

  return action;
}

/**
 * 示例 2: 在不同环境中执行
 */
export async function example2_ExecuteInDifferentEnvironments() {
  const action: ActionDescriptor = {
    type: ActionType.CLICK,
    payload: {
      selector: {
        type: 'css',
        value: '#submit-button',
        waitFor: 3000,
      },
      clickType: 'left',
      delay: 500,
      humanLike: true,
    },
  };

  const context: ExecutionContext = {
    variables: { tabId: 123, sessionId: 'abc-def' },
    table: [],
    loopData: {},
    globalData: {},
  };

  // 在 Mock 环境中执行
  console.log('\n=== Mock Environment ===');
  const mockExecutor = ActionExecutorFactory.createClickExecutor('mock');
  const mockResult = await mockExecutor.execute(action, context);
  console.log('Result:', mockResult);

  // 在插件环境中执行 (需要浏览器扩展上下文)
  // console.log('\n=== Extension Environment ===');
  // const extensionExecutor = ActionExecutorFactory.createClickExecutor('extension');
  // const extensionResult = await extensionExecutor.execute(action, context);

  // 发送到远程代理执行
  // console.log('\n=== Remote Agent Environment ===');
  // const remoteExecutor = ActionExecutorFactory.createClickExecutor('remote', {
  //   apiEndpoint: 'https://api.example.com'
  // });
  // const remoteResult = await remoteExecutor.execute(action, context);
}

/**
 * 示例 3: 完整的工作流 JSON 输出
 */
export function example3_CompleteWorkflowJSON() {
  const workflowJSON = {
    id: 'wf-001',
    name: 'Login Flow',
    version: '1.0.0',
    createdAt: Date.now(),
    config: {
      mode: 'sequential',
      onError: 'stop',
      stepDelay: 1000,
      saveLog: true,
    },
    steps: [
      {
        id: 'step-1',
        name: 'Navigate to Login Page',
        type: 'navigate',
        action: {
          type: 'navigate',
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
        name: 'Click Username Field',
        type: 'click',
        action: {
          type: 'click',
          payload: {
            selector: {
              type: 'css',
              value: '#username',
              waitFor: 3000,
            },
            clickType: 'left',
          },
        },
        next: { default: 'step-3' },
        config: {},
      },
      {
        id: 'step-3',
        name: 'Type Username',
        type: 'type',
        action: {
          type: 'type',
          payload: {
            selector: {
              type: 'css',
              value: '#username',
            },
            text: '{{username}}',
            clearBefore: true,
          },
        },
        next: { default: 'step-4' },
        config: {},
      },
      {
        id: 'step-4',
        name: 'Click Submit Button',
        type: 'click',
        action: {
          type: 'click',
          payload: {
            selector: {
              type: 'css',
              value: '#submit-button',
            },
            clickType: 'left',
            humanLike: true,
          },
        },
        next: { default: null },
        config: {},
      },
    ],
    context: {
      variables: {
        username: 'demo@example.com',
      },
      table: [],
      loopData: {},
      globalData: {},
    },
    metadata: {
      sourceWorkflowId: 'wf-001',
      compiler: 'AutomaWebCompiler',
      compilerVersion: '2.0.0',
    },
  };

  console.log('📄 Complete Workflow Execution Plan:');
  console.log(JSON.stringify(workflowJSON, null, 2));

  return workflowJSON;
}
