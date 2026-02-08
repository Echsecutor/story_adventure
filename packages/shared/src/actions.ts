/**
 * Action system for executing story logic when entering sections.
 *
 * Actions modify story state, variables, and choices dynamically.
 */

import type { Story, ActionType, ComparisonOperator } from './types.js';

/**
 * Comparison function for evaluating variable conditions.
 *
 * @param value1 - First value (typically a variable value)
 * @param operator - Comparison operator (=, !=, <, >, <=, >=)
 * @param value2 - Second value (typically a comparison target)
 * @returns True if comparison succeeds, false otherwise
 *
 * @example
 * ```ts
 * compare("5", ">", "3") // Returns: true
 * compare("hello", "=", "hello") // Returns: true
 * ```
 */
export function compare(
  value1: string | number,
  operator: ComparisonOperator,
  value2: string | number
): boolean {
  let result: boolean;
  switch (operator) {
    case '=':
      result = value1 == value2;
      break;
    case '<':
      result = Number(value1) < Number(value2);
      break;
    case '>':
      result = Number(value1) > Number(value2);
      break;
    case '!=':
      result = String(value1) != String(value2);
      break;
    case '>=':
      result = Number(value1) >= Number(value2);
      break;
    case '<=':
      result = Number(value1) <= Number(value2);
      break;
    default:
      console.log('Unsupported operator', operator);
      return false;
  }
  console.log(`Comparison result for ${value1} ${operator} ${value2}: ${result}`);
  return result;
}

/**
 * Sets a story variable to a value.
 *
 * @param story - Story object to modify
 * @param key - Variable name
 * @param value - Value to set
 */
function set_story_variable(story: Story, key: string, value: string): void {
  if (!story.state) {
    story.state = {};
  }
  if (!story.state.variables) {
    story.state.variables = {};
  }
  story.state.variables[key] = value;
  console.debug(`Setting ${key} = ${value}`);
}

/**
 * SET action: Sets a variable to a value.
 *
 * @param story - Story object to modify
 * @param parameters - [variable_name, value]
 */
function set_variable(story: Story, parameters: string[]): void {
  if (!parameters || parameters.length < 2 || !parameters[0] || !parameters[1]) {
    console.log('Too few parameters to set variable', parameters);
    return;
  }
  set_story_variable(story, parameters[0], parameters[1]);
}

/**
 * ADD_TO_VARIABLE action: Adds a numeric value to an existing variable.
 *
 * @param story - Story object to modify
 * @param parameters - [variable_name, value_to_add]
 */
function add_to_variable(story: Story, parameters: string[]): void {
  if (!parameters || parameters.length < 2 || !parameters[0] || !parameters[1]) {
    console.log('Too few parameters to add to variable', parameters);
    return;
  }

  const currentValue = story?.state?.variables?.[parameters[0]] || '0';
  const newValue = String(Number(currentValue) + Number(parameters[1]));
  set_story_variable(story, parameters[0], newValue);
}

/**
 * Action handler function type.
 */
type ActionHandler = (story: Story, parameters: string[]) => void;

/**
 * Action definition containing parameter types and handler function.
 */
export interface ActionDefinition {
  /** Expected parameter types */
  parameters: string[];
  /** Optional enum values for enum-type parameters */
  enum?: string[];
  /** Action handler function */
  action: ActionHandler;
}

/**
 * Registry of all supported actions.
 */
export const supported_actions: Record<ActionType, ActionDefinition> = {
  NONE: {
    parameters: [],
    action: () => {},
  },
  INPUT: {
    parameters: ['VARIABLE', 'STRING'], // prompt text
    action: set_variable, // INPUT uses set_variable after prompting user
  },
  SET: {
    parameters: ['VARIABLE', 'STRING'], // value to set
    action: set_variable,
  },
  ADD_TO_VARIABLE: {
    parameters: ['VARIABLE', 'STRING'], // value to add
    action: add_to_variable,
  },
  COMPARE_DO: {
    parameters: ['VARIABLE', 'ENUM', 'STRING', 'ACTION'],
    enum: ['=', '!=', '>', '>=', '<=', '<'],
    action: function (story: Story, parameters: string[]): void {
      if (!parameters || parameters.length < 4 || !parameters[0] || !parameters[1] || !parameters[2] || !parameters[3]) {
        console.log('Too few parameters for COMPARE_DO action', parameters);
        return;
      }
      const enumValues = this.enum;
      if (!enumValues || !enumValues.includes(parameters[1])) {
        console.log('Bad enum', parameters[1], 'in');
        return;
      }
      const operator = parameters[1] as ComparisonOperator;

      const next_action = supported_actions?.[parameters[3] as ActionType]?.action;
      if (!next_action) {
        console.log('No such action', parameters[3]);
        return;
      }

      const varValue = story?.state?.variables?.[parameters[0]];
      if (!varValue) {
        console.debug(`COMPARE_DO var ${parameters[0]} not set`);
        return;
      }

      if (compare(varValue, operator, parameters[2])) {
        return next_action(story, parameters.slice(4));
      }
    },
  },
  IF_SET_DO: {
    parameters: ['VARIABLE', 'ACTION'],
    action: (story: Story, parameters: string[]): void => {
      if (!parameters || parameters.length < 2 || !parameters[0] || !parameters[1]) {
        console.log('Too few parameters for IF_SET_DO action', parameters);
        return;
      }
      if (!supported_actions?.[parameters[1] as ActionType]) {
        console.log('No such action', parameters[1]);
        return;
      }
      if (story?.state?.variables?.[parameters[0]]) {
        console.debug(
          'chaining to action',
          parameters[1],
          'with parameters',
          parameters.slice(2)
        );
        supported_actions[parameters[1] as ActionType].action(
          story,
          parameters.slice(2)
        );
      }
    },
  },
  IF_NOT_SET_DO: {
    parameters: ['VARIABLE', 'ACTION'],
    action: (story: Story, parameters: string[]): void => {
      if (!parameters || parameters.length < 2 || !parameters[0] || !parameters[1]) {
        console.log('Too few parameters for IF_NOT_SET_DO action', parameters);
        return;
      }
      if (!supported_actions?.[parameters[1] as ActionType]) {
        console.log('No such action', parameters[1]);
        return;
      }
      if (!story?.state?.variables?.[parameters[0]]) {
        console.debug(
          'chaining to action',
          parameters[1],
          'with parameters',
          parameters.slice(2)
        );
        supported_actions[parameters[1] as ActionType].action(
          story,
          parameters.slice(2)
        );
      }
    },
  },
  ADD_CHOICE: {
    parameters: ['SECTION', 'STRING'],
    action: (story: Story, parameters: string[]): void => {
      if (!parameters || parameters.length < 2 || !parameters[0] || !parameters[1]) {
        console.log('Too few parameters for ADD_CHOICE action', parameters);
        return;
      }
      const currentSectionId = story?.state?.current_section;
      if (!currentSectionId) {
        console.log(
          'No current section to add choice for ADD_CHOICE action',
          story.state
        );
        return;
      }

      const currentSection = story.sections[currentSectionId];
      if (!currentSection) {
        console.log('Current section not found', currentSectionId);
        return;
      }

      if (!currentSection.next) {
        currentSection.next = [];
      }
      // Check if choice already exists
      for (const choice of currentSection.next) {
        if (choice?.next == parameters[0] && choice?.text == parameters[1]) {
          // choice already exists
          return;
        }
      }
      currentSection.next.push({
        text: parameters[1],
        next: parameters[0],
      });
    },
  },
  REMOVE_CHOICE: {
    parameters: ['SECTION'],
    action: (story: Story, parameters: string[]): void => {
      if (!parameters || parameters.length < 1 || !parameters[0]) {
        console.log('Too few parameters for REMOVE_CHOICE action', parameters);
        return;
      }
      const currentSectionId = story?.state?.current_section;
      if (!currentSectionId) {
        console.log(
          'No current section to remove choice for REMOVE_CHOICE action',
          story.state
        );
        return;
      }

      const currentSection = story.sections[currentSectionId];
      if (!currentSection) {
        console.log('Current section not found', currentSectionId);
        return;
      }

      const choices = currentSection.next;
      if (!choices) {
        return;
      }

      for (let i = 0; i < choices.length; i++) {
        if (choices[i]?.next == parameters[0]) {
          console.debug(
            'Removing choice',
            choices[i],
            'at position',
            i,
            'in',
            choices
          );
          choices.splice(i, 1);
          return;
        }
      }
    },
  },
  IF_SET_ADD_CHOICE: {
    parameters: ['VARIABLE', 'SECTION', 'STRING'],
    action: (story: Story, parameters: string[]): void => {
      if (!parameters || parameters.length < 3 || !parameters[0] || !parameters[1] || !parameters[2]) {
        console.log(
          'Too few parameters for IF_SET_ADD_CHOICE action',
          parameters
        );
        return;
      }
      const currentSectionId = story?.state?.current_section;
      if (!currentSectionId) {
        console.log(
          'No current section to add choice for IF_SET_ADD_CHOICE action',
          story.state
        );
        return;
      }
      if (story?.state?.variables?.[parameters[0]]) {
        const currentSection = story.sections[currentSectionId];
        if (!currentSection) {
          console.log('Current section not found', currentSectionId);
          return;
        }

        if (!currentSection.next) {
          currentSection.next = [];
        }
        // Check if choice already exists
        for (const choice of currentSection.next) {
          if (choice?.next == parameters[1] && choice?.text == parameters[2]) {
            // choice already exists
            return;
          }
        }
        currentSection.next.push({
          text: parameters[2],
          next: parameters[1],
        });
      }
    },
  },
  IF_SET_REMOVE_CHOICE: {
    parameters: ['VARIABLE', 'SECTION'],
    action: (story: Story, parameters: string[]): void => {
      if (!parameters || parameters.length < 2 || !parameters[0] || !parameters[1]) {
        console.log(
          'Too few parameters for IF_SET_REMOVE_CHOICE action',
          parameters
        );
        return;
      }
      const currentSectionId = story?.state?.current_section;
      if (!currentSectionId) {
        console.log(
          'No current section to remove choice for IF_SET_REMOVE_CHOICE action',
          story.state
        );
        return;
      }
      if (story?.state?.variables?.[parameters[0]]) {
        const currentSection = story.sections[currentSectionId];
        if (!currentSection) {
          console.log('Current section not found', currentSectionId);
          return;
        }

        const choices = currentSection.next;
        if (!choices) {
          return;
        }

        for (let i = 0; i < choices.length; i++) {
          if (choices[i]?.next == parameters[1]) {
            choices.splice(i, 1);
            return;
          }
        }
      }
    },
  },
};

/**
 * Executes all actions in a section's script array.
 *
 * @param story - Story object to modify
 * @param actions - Array of action objects to execute
 */
export function execute_actions(story: Story, actions: Array<{ action: ActionType; parameters: string[] }>): void {
  if (!actions) {
    return;
  }
  for (const actionObj of actions) {
    const actionDef = supported_actions[actionObj.action];
    if (!actionDef) {
      console.log('Unknown action type', actionObj.action);
      continue;
    }
    actionDef.action(story, actionObj.parameters || []);
  }
}
