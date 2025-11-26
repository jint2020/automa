import VTooltip from '../directives/VTooltip';
import VAutofocus from '../directives/VAutofocus';
import VClosePopover from '../directives/VClosePopover';

// Vite's import.meta.glob for auto-importing components
const uiComponents = import.meta.glob('../components/ui/*.vue', { eager: true });
const transitionComponents = import.meta.glob('../components/transitions/*.vue', {
  eager: true,
});

function componentsExtractor(app, components) {
  Object.keys(components).forEach((path) => {
    // Extract component name from path
    // Path format: ../components/ui/ComponentName.vue
    const componentName = path.split('/').pop().replace(/\.vue$/, '');
    const component = components[path]?.default ?? {};

    app.component(componentName, component);
  });
}

export default function (app) {
  app.directive('tooltip', VTooltip);
  app.directive('autofocus', VAutofocus);
  app.directive('close-popover', VClosePopover);

  componentsExtractor(app, uiComponents);
  componentsExtractor(app, transitionComponents);
}

