<template>
  <div class="workflow-variables">
    <!-- Tabs for different variable types (extensible) -->
    <ui-tabs v-model="activeTab" class="mb-4">
      <ui-tab v-for="tab in variableTabs" :key="tab.id" :value="tab.id">
        {{ tab.name }}
        <span
          v-if="getVariableCount(tab.id) > 0"
          class="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700"
        >
          {{ getVariableCount(tab.id) }}
        </span>
      </ui-tab>
    </ui-tabs>

    <!-- Tab Content -->
    <div class="tab-content" style="height: calc(100vh - 16rem)">
      <!-- Variables Tab -->
      <div v-if="activeTab === 'variables'" class="h-full overflow-auto">
        <!-- Usage Guide -->
        <div
          class="mb-4 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900 dark:bg-opacity-20"
        >
          <p class="mb-2 font-semibold text-blue-800 dark:text-blue-300">
            {{ t('workflow.variables.usage.title') }}
          </p>
          <ul
            class="list-inside list-disc space-y-1 text-blue-700 dark:text-blue-400"
          >
            <li>
              {{ t('workflow.variables.usage.access') }}:
              <code class="rounded bg-blue-100 px-1 dark:bg-blue-800">
                {{ usageExamples.access }}
              </code>
            </li>
            <li>
              {{ t('workflow.variables.usage.altSyntax') }}:
              <code class="rounded bg-blue-100 px-1 dark:bg-blue-800">
                {{ usageExamples.altSyntax }}
              </code>
            </li>
            <li>
              {{ t('workflow.variables.usage.nested') }}:
              <code class="rounded bg-blue-100 px-1 dark:bg-blue-800">
                {{ usageExamples.nested }}
              </code>
            </li>
          </ul>
        </div>

        <!-- Grouped Variables List -->
        <template v-if="totalVariablesCount > 0">
          <div v-for="group in variableGroups" :key="group.id" class="mb-4">
            <template v-if="group.variables.length > 0">
              <!-- Group Header -->
              <div
                class="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                <v-remixicon :name="group.icon" size="16" />
                <span>{{ group.name }}</span>
                <span
                  class="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700"
                >
                  {{ group.variables.length }}
                </span>
              </div>

              <!-- Variables in Group -->
              <div class="space-y-2">
                <div
                  v-for="(item, index) in group.variables"
                  :key="index"
                  class="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <code
                          class="cursor-pointer rounded bg-gray-100 px-2 py-0.5 text-sm font-medium dark:bg-gray-700"
                          :title="t('workflow.variables.clickToCopy')"
                          @click="copyVariable(item.name)"
                        >
                          {{ item.name }}
                        </code>
                        <span
                          v-if="item.type"
                          class="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        >
                          {{ item.type }}
                        </span>
                        <span
                          v-if="item.isGlobal"
                          class="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300"
                        >
                          {{ t('workflow.variables.global') }}
                        </span>
                      </div>
                      <p
                        v-if="item.description"
                        class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                      >
                        {{ item.description }}
                      </p>
                      <p
                        v-if="
                          item.defaultValue !== undefined &&
                          item.defaultValue !== ''
                        "
                        class="mt-1 text-xs text-gray-500 dark:text-gray-400"
                      >
                        {{ t('workflow.variables.defaultValue') }}:
                        <code class="rounded bg-gray-100 px-1 dark:bg-gray-600">
                          {{ formatDefaultValue(item.defaultValue) }}
                        </code>
                      </p>
                      <p
                        v-if="item.sourceBlock"
                        class="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
                      >
                        <v-remixicon name="riMapPinLine" size="12" />
                        {{ t('workflow.variables.source') }}:
                        <span
                          class="cursor-pointer rounded bg-orange-100 px-1.5 py-0.5 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800"
                          :title="t('workflow.variables.clickToLocate')"
                          @click="locateBlock(item.sourceBlock.id)"
                        >
                          {{ item.sourceBlock.name || item.sourceBlock.label }}
                        </span>
                      </p>
                    </div>
                    <button
                      class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                      :title="t('workflow.variables.copyRef')"
                      @click="copyVariableRef(item.name)"
                    >
                      <v-remixicon name="riFileCopyLine" size="18" />
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>

        <!-- Empty State -->
        <div v-else class="py-8 text-center">
          <v-remixicon
            name="riBracketsLine"
            size="48"
            class="mx-auto mb-3 text-gray-300 dark:text-gray-600"
          />
          <p class="text-gray-500 dark:text-gray-400">
            {{ t('workflow.variables.empty') }}
          </p>
          <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">
            {{ t('workflow.variables.emptyHint') }}
          </p>
        </div>
      </div>

      <!-- Placeholder for future variable types -->
      <div v-else class="flex h-full items-center justify-center text-gray-400">
        {{ t('workflow.variables.comingSoon') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();
const toast = useToast();

// Usage examples (defined as constants to avoid template parsing issues)
const usageExamples = {
  access: '{{ variables.variableName }}',
  altSyntax: '{{ variables@variableName }}',
  nested: '{{ variables.user.name }}',
};

// Parameter type labels
const paramTypeLabels = {
  string: 'String',
  number: 'Number',
  json: 'JSON',
  checkbox: 'Boolean',
};

// Inject autocomplete data from parent
const autocompleteData = inject('autocompleteData', ref({}));

// Inject editor instance for block location
const editor = inject('workflow-editor', null);

// Active tab
const activeTab = ref('variables');

// Tab definitions (extensible for future variable types)
const variableTabs = computed(() => [
  {
    id: 'variables',
    name: t('workflow.variables.types.variables'),
  },
  // Future tabs can be added here:
  // { id: 'loopData', name: t('workflow.variables.types.loopData') },
  // { id: 'table', name: t('workflow.variables.types.table') },
  // { id: 'globalData', name: t('workflow.variables.types.globalData') },
]);

// Variable groups definition
const variableGroups = computed(() => {
  const groups = [
    {
      id: 'global',
      name: t('workflow.variables.groups.global'),
      icon: 'riGlobalLine',
      variables: [],
    },
    {
      id: 'trigger',
      name: t('workflow.variables.groups.triggerParams'),
      icon: 'riFlashlightLine',
      variables: [],
    },
    {
      id: 'contextMenu',
      name: t('workflow.variables.groups.contextMenu'),
      icon: 'riMenuLine',
      variables: [],
    },
    {
      id: 'insertData',
      name: t('workflow.variables.groups.insertData'),
      icon: 'riDatabase2Line',
      variables: [],
    },
    {
      id: 'blockOutput',
      name: t('workflow.variables.groups.blockOutput'),
      icon: 'riArchiveDrawerFill',
      variables: [],
    },
    {
      id: 'other',
      name: t('workflow.variables.groups.other'),
      icon: 'riBracketsLine',
      variables: [],
    },
  ];

  const addedNames = new Set();
  const drawflow = props.workflow?.drawflow;

  // 1. Extract global variables from autocomplete
  const autocomplete = autocompleteData.value || {};
  if (autocomplete.variables) {
    Object.keys(autocomplete.variables).forEach((name) => {
      if (name.startsWith('$$') && !addedNames.has(name)) {
        addedNames.add(name);
        groups[0].variables.push({
          name,
          isGlobal: true,
          type: null,
        });
      }
    });
  }

  // Helper to create source block info
  const getSourceBlock = (node) => ({
    id: node.id,
    label: node.label,
    name: node.data?.description || null,
  });

  // 2. Extract trigger parameters and context menu variables
  if (drawflow?.nodes) {
    drawflow.nodes.forEach((node) => {
      if (node.label === 'trigger') {
        const sourceBlock = getSourceBlock(node);

        // Trigger parameters
        if (node.data?.parameters) {
          node.data.parameters.forEach((param) => {
            if (param.name?.trim() && !addedNames.has(param.name)) {
              addedNames.add(param.name);
              groups[1].variables.push({
                name: param.name,
                isGlobal: false,
                type: paramTypeLabels[param.type] || param.type,
                description: param.description || null,
                defaultValue: param.defaultValue,
                sourceBlock,
              });
            }
          });
        }

        // Context menu special variables
        if (node.data?.type === 'context-menu') {
          const ctxVars = [
            {
              name: '$ctxElSelector',
              type: 'String',
              description: t('workflow.variables.ctxDesc.elSelector'),
            },
            {
              name: '$ctxTextSelection',
              type: 'String',
              description: t('workflow.variables.ctxDesc.textSelection'),
            },
            {
              name: '$ctxLink',
              type: 'String',
              description: t('workflow.variables.ctxDesc.link'),
            },
            {
              name: '$ctxMediaUrl',
              type: 'String',
              description: t('workflow.variables.ctxDesc.mediaUrl'),
            },
          ];
          ctxVars.forEach((v) => {
            if (!addedNames.has(v.name)) {
              addedNames.add(v.name);
              groups[2].variables.push({
                name: v.name,
                isGlobal: false,
                type: v.type,
                description: v.description,
                sourceBlock,
              });
            }
          });
        }
      }

      // 3. Extract insert-data variables
      if (node.label === 'insert-data' && node.data?.dataList) {
        const sourceBlock = getSourceBlock(node);

        node.data.dataList.forEach((item) => {
          if (
            item.type === 'variable' &&
            item.name?.trim() &&
            !addedNames.has(item.name)
          ) {
            // Skip global variables here (already handled)
            if (item.name.startsWith('$$')) return;

            addedNames.add(item.name);
            groups[3].variables.push({
              name: item.name,
              isGlobal: false,
              type: item.isFile ? 'File' : null,
              description: node.data.description || null,
              sourceBlock,
            });
          }
        });
      }

      // 4. Extract variables from blocks that output to variableName
      // Many blocks can save their output to a variable via variableName field
      // Check both: blocks with assignVariable flag AND blocks that directly use variableName
      const hasVariableName = node.data?.variableName?.trim();
      const shouldAssign =
        node.data?.assignVariable !== false && // default to true if not specified
        hasVariableName;

      if (shouldAssign && !addedNames.has(node.data.variableName)) {
        const varName = node.data.variableName;
        // Skip global variables (already handled)
        if (!varName.startsWith('$$')) {
          addedNames.add(varName);
          const sourceBlock = getSourceBlock(node);
          groups[4].variables.push({
            name: varName,
            isGlobal: false,
            type: null,
            description: node.data.description || null,
            sourceBlock,
          });
        }
      }
    });
  }

  // 5. Add remaining variables from autocomplete to "other" group
  if (autocomplete.variables) {
    Object.keys(autocomplete.variables).forEach((name) => {
      if (!addedNames.has(name)) {
        addedNames.add(name);
        groups[5].variables.push({
          name,
          isGlobal: false,
          type: null,
        });
      }
    });
  }

  // Sort variables within each group alphabetically
  groups.forEach((group) => {
    group.variables.sort((a, b) => a.name.localeCompare(b.name));
  });

  return groups;
});

// Total variables count
const totalVariablesCount = computed(() => {
  return variableGroups.value.reduce(
    (sum, group) => sum + group.variables.length,
    0
  );
});

// Get variable count for a tab
function getVariableCount(tabId) {
  if (tabId === 'variables') {
    return totalVariablesCount.value;
  }
  return 0;
}

// Format default value for display
function formatDefaultValue(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Copy variable name
function copyVariable(name) {
  navigator.clipboard.writeText(name).then(() => {
    toast.success(t('workflow.variables.copied', { name }));
  });
}

// Copy variable reference syntax
function copyVariableRef(name) {
  const refStr = `{{ variables.${name} }}`;
  navigator.clipboard.writeText(refStr).then(() => {
    toast.success(t('workflow.variables.copiedRef'));
  });
}

// Locate block in editor
function locateBlock(nodeId) {
  if (!editor?.value) return;

  const block = editor.value.getNode.value(nodeId);
  if (!block) return;

  // Select the node
  editor.value.addSelectedNodes([block]);

  // Center view on the node
  setTimeout(() => {
    const editorContainer = document.querySelector('.vue-flow');
    if (!editorContainer) return;

    const { height, width } = editorContainer.getBoundingClientRect();
    const { x, y } = block.position;

    editor.value.setTransform({
      y: -(y - height / 2),
      x: -(x - width / 2) - 200,
      zoom: 1,
    });
  }, 200);
}
</script>

<style scoped>
.workflow-variables {
  min-height: 300px;
}

code {
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
}
</style>
