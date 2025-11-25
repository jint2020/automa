/**
 * Workflow Compiler - Convert Visual Flow to Executable JSON
 *
 * The WorkflowCompiler takes a workflow from the visual editor and compiles
 * it into a standardized execution format. This is the step that happens
 * when a user clicks "Run" in the Web architecture.
 *
 * Responsibilities:
 * 1. Validate the workflow structure
 * 2. Resolve template variables (e.g., {{variables.name}})
 * 3. Optimize execution order
 * 4. Generate the final executable JSON
 */

import { getAction, isValidActionType } from '../types/action-interface';
import {
  createEmptyWorkflowSchema,
  validateWorkflowSchema,
} from '../types/workflow-schema';

/**
 * @typedef {Object} CompiledWorkflow
 * @property {Object} metadata - Workflow metadata
 * @property {Object} settings - Execution settings
 * @property {Array<CompiledAction>} actions - Ordered list of actions
 * @property {Object} variables - Initial variables
 * @property {Object} connectionGraph - Graph of connections
 */

/**
 * @typedef {Object} CompiledAction
 * @property {string} id - Action ID
 * @property {string} type - Action type
 * @property {Object} params - Resolved parameters
 * @property {Array<string>} outputs - IDs of connected output nodes
 * @property {Object} raw - Original action data
 */

/**
 * @typedef {Object} CompileOptions
 * @property {boolean} [resolveTemplates=false] - Resolve template variables
 * @property {boolean} [validateActions=true] - Validate action data
 * @property {boolean} [optimizeOrder=false] - Optimize execution order
 * @property {Object} [templateContext] - Context for template resolution
 */

/**
 * Workflow Compiler
 */
class WorkflowCompiler {
  /**
   * @param {Object} workflow - The workflow from the visual editor
   */
  constructor(workflow) {
    // Normalize the workflow to our schema format
    this.workflow = this._normalizeWorkflow(workflow);
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Compile the workflow to executable JSON
   * @param {CompileOptions} [options] - Compile options
   * @returns {{ success: boolean, compiled?: CompiledWorkflow, errors: string[], warnings: string[] }}
   */
  compile(options = {}) {
    const opts = {
      resolveTemplates: false,
      validateActions: true,
      optimizeOrder: false,
      templateContext: {},
      ...options,
    };

    this.errors = [];
    this.warnings = [];

    // Step 1: Validate workflow structure
    const validation = validateWorkflowSchema(this.workflow);
    if (!validation.valid) {
      this.errors.push(...validation.errors);
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
      };
    }

    // Step 2: Build connection graph
    const connectionGraph = this._buildConnectionGraph();

    // Step 3: Find trigger (entry point)
    const triggerNode = this._findTriggerNode();
    if (!triggerNode) {
      this.errors.push('No trigger node found in workflow');
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
      };
    }

    // Step 4: Compile each action (pass connectionGraph to avoid rebuilding)
    const actions = this._compileActions(opts, connectionGraph);

    // Step 5: Optionally optimize order
    const orderedActions = opts.optimizeOrder
      ? this._optimizeOrder(actions, triggerNode.id, connectionGraph)
      : actions;

    // Step 6: Build the final compiled workflow
    const compiled = {
      schemaVersion: '1.0.0',
      compiledAt: new Date().toISOString(),
      metadata: this.workflow.metadata,
      settings: this.workflow.settings,
      entryPoint: triggerNode.id,
      variables: this._compileVariables(),
      globalData: this.workflow.globalData,
      actions: orderedActions,
      connectionGraph,
      statistics: {
        totalActions: orderedActions.length,
        actionTypes: this._countActionTypes(orderedActions),
        hasLoops: this._hasLoops(orderedActions),
        hasConditions: this._hasConditions(orderedActions),
      },
    };

    return {
      success: this.errors.length === 0,
      compiled: this.errors.length === 0 ? compiled : null,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Normalize workflow to standard schema
   * @private
   */
  _normalizeWorkflow(workflow) {
    // If it's already in our format, return as-is
    if (workflow.schemaVersion && workflow.drawflow) {
      return workflow;
    }

    // Convert from Automa's internal format
    const normalized = createEmptyWorkflowSchema({
      id: workflow.id || `workflow-${Date.now()}`,
      name: workflow.name || 'Unnamed Workflow',
      description: workflow.description || '',
    });

    // Copy settings
    if (workflow.settings) {
      normalized.settings = {
        ...normalized.settings,
        ...workflow.settings,
      };
    }

    // Copy drawflow
    if (workflow.drawflow) {
      normalized.drawflow = workflow.drawflow;
    }

    // Copy columns/table
    if (workflow.table || workflow.dataColumns) {
      const columns = workflow.table || workflow.dataColumns || [];
      normalized.columns = Array.isArray(columns)
        ? columns.map((col, idx) => ({
            id: col.id || col.name,
            name: col.name,
            type: col.type || 'any',
            index: idx,
          }))
        : Object.values(columns).map((col, idx) => ({
            id: col.id || col.name,
            name: col.name,
            type: col.type || 'any',
            index: idx,
          }));
    }

    // Copy global data
    if (workflow.globalData) {
      normalized.globalData = workflow.globalData;
    }

    return normalized;
  }

  /**
   * Build connection graph from edges
   * @private
   */
  _buildConnectionGraph() {
    const graph = {};
    const edges = this.workflow.drawflow?.edges || [];

    edges.forEach((edge) => {
      if (!graph[edge.source]) {
        graph[edge.source] = {
          outputs: {},
        };
      }

      // Parse output index from sourceHandle (e.g., "node-1-output-1" -> 1)
      const outputMatch = edge.sourceHandle?.match(/-output-(\d+)$/);
      const outputIndex = outputMatch ? outputMatch[1] : '1';

      if (!graph[edge.source].outputs[outputIndex]) {
        graph[edge.source].outputs[outputIndex] = [];
      }

      graph[edge.source].outputs[outputIndex].push({
        target: edge.target,
        targetHandle: edge.targetHandle,
      });
    });

    return graph;
  }

  /**
   * Find the trigger node
   * @private
   */
  _findTriggerNode() {
    const nodes = this.workflow.drawflow?.nodes || [];
    return nodes.find(
      (node) => node.label === 'trigger' || node.type === 'trigger'
    );
  }

  /**
   * Compile all actions
   * @private
   */
  _compileActions(options, connectionGraph) {
    const nodes = this.workflow.drawflow?.nodes || [];
    const compiledActions = [];

    nodes.forEach((node) => {
      const compiledAction = this._compileAction(node, options, connectionGraph);
      if (compiledAction) {
        compiledActions.push(compiledAction);
      }
    });

    return compiledActions;
  }

  /**
   * Compile a single action
   * @private
   */
  _compileAction(node, options, connectionGraph) {
    const actionType = node.type || node.label;
    const actionDef = getAction(actionType);

    // Validate action type
    if (options.validateActions && !isValidActionType(actionType)) {
      this.warnings.push(
        `Unknown action type: ${actionType} (node: ${node.id})`
      );
    }

    // Get outputs from connection graph (passed in, not rebuilt)
    const outputs = connectionGraph[node.id]?.outputs || {};

    // Resolve parameters
    let params = { ...node.data };
    if (options.resolveTemplates) {
      params = this._resolveTemplates(params, options.templateContext);
    }

    // Validate action data if we have a definition
    if (options.validateActions && actionDef) {
      const validation = actionDef.validate(params);
      if (!validation.valid) {
        validation.errors.forEach((error) => {
          this.warnings.push(`${node.label} (${node.id}): ${error}`);
        });
      }
    }

    return {
      id: node.id,
      type: actionType,
      label: node.label,
      params,
      position: node.position,
      outputs: Object.entries(outputs).reduce((acc, [key, targets]) => {
        acc[key] = targets.map((t) => t.target);
        return acc;
      }, {}),
      disabled: node.data?.disableBlock || false,
      raw: node,
    };
  }

  /**
   * Resolve template variables in parameters
   * @private
   */
  _resolveTemplates(params, context) {
    const resolved = {};

    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        resolved[key] = this._resolveTemplateString(value, context);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this._resolveTemplates(value, context);
      } else {
        resolved[key] = value;
      }
    });

    return resolved;
  }

  /**
   * Resolve template placeholders in a string
   * @private
   */
  _resolveTemplateString(str, context) {
    // Simple template resolution: {{path.to.value}}
    return str.replace(/\{\{(.+?)\}\}/g, (match, path) => {
      const parts = path.trim().split('.');
      let value = context;

      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          return match; // Keep original if not found
        }
      }

      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Compile initial variables
   * @private
   */
  _compileVariables() {
    const variables = {};
    (this.workflow.variables || []).forEach((v) => {
      variables[v.name] = {
        value: v.value,
        type: v.type || 'any',
      };
    });
    return variables;
  }

  /**
   * Optimize action order using topological sort
   * @private
   */
  _optimizeOrder(actions, entryPointId, connectionGraph) {
    const visited = new Set();
    const order = [];
    const actionMap = new Map(actions.map((a) => [a.id, a]));

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const action = actionMap.get(nodeId);
      if (!action) return;

      // Visit all connected nodes first (for dependencies)
      const outputs = connectionGraph[nodeId]?.outputs || {};
      Object.values(outputs)
        .flat()
        .forEach((conn) => {
          visit(conn.target);
        });

      order.unshift(action);
    };

    // Start from entry point
    visit(entryPointId);

    // Add any remaining nodes (disconnected)
    actions.forEach((action) => {
      if (!visited.has(action.id)) {
        order.push(action);
      }
    });

    return order;
  }

  /**
   * Count action types
   * @private
   */
  _countActionTypes(actions) {
    const counts = {};
    actions.forEach((action) => {
      counts[action.type] = (counts[action.type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Check if workflow has loops
   * @private
   */
  _hasLoops(actions) {
    return actions.some(
      (a) =>
        a.type === 'loop-data' ||
        a.type === 'loop-elements' ||
        a.type === 'while-loop' ||
        a.type === 'repeat-task'
    );
  }

  /**
   * Check if workflow has conditions
   * @private
   */
  _hasConditions(actions) {
    return actions.some(
      (a) => a.type === 'conditions' || a.type === 'element-exists'
    );
  }

  /**
   * Generate a summary of the workflow
   * @returns {Object}
   */
  getSummary() {
    const nodes = this.workflow.drawflow?.nodes || [];
    const edges = this.workflow.drawflow?.edges || [];

    return {
      name: this.workflow.metadata?.name || 'Unnamed',
      nodeCount: nodes.length,
      edgeCount: edges.length,
      actionTypes: this._countActionTypes(
        nodes.map((n) => ({ type: n.type || n.label }))
      ),
      hasTrigger: !!this._findTriggerNode(),
      variables: (this.workflow.variables || []).map((v) => v.name),
      columns: (this.workflow.columns || []).map((c) => c.name),
    };
  }
}

/**
 * Compile a workflow (convenience function)
 * @param {Object} workflow - Workflow to compile
 * @param {CompileOptions} [options] - Compile options
 * @returns {Object}
 */
export function compileWorkflow(workflow, options = {}) {
  const compiler = new WorkflowCompiler(workflow);
  return compiler.compile(options);
}

export default WorkflowCompiler;
