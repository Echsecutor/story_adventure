export const supported_actions = {
  NONE: {
    parameters: [],
    action: () => {},
  },
  INPUT: {
    parameters: [
      "VARIABLE",
      "STRING", // prompt text
    ],
    action: set_variable,
  },
  SET: {
    parameters: [
      "VARIABLE",
      "STRING", // value to set
    ],
    action: set_variable,
  },
  ADD_TO_VARIABLE: {
    parameters: [
      "VARIABLE",
      "STRING", // value to add
    ],
    action: add_to_variable,
  },
  COMPARE_DO: {
    parameters: ["VARIABLE", "ENUM", "STRING", "ACTION"],
    enum: ["=", "!=", ">", ">=", "<=", "<"],
    action: function (story, parameters) {
      if (!parameters || parameters.length < 4) {
        console.log("To few parameters for COMPARE_DO action", parameters);
        return;
      }
      if (!this.enum.includes(parameters[1])) {
        console.log("Bad enum", parameters[1], "in");
        return;
      }
      const operator = parameters[1];

      const next_action = supported_actions?.[parameters[3]]?.action
      if (!next_action) {
        console.log("No such action", parameters[3]);
        return;
      }
      
      if (!story?.state?.variables?.[parameters[0]]) {
        console.debug(`COMPARE_DO var ${parameters[0]} not set`);
        return;
      }
      const variable_value = story?.state?.variables?.[parameters[0]];

      if (compare(variable_value, operator, parameters[2])) {
        return next_action(
          story,
          parameters.slice(4)
        );
      }
    },
  },
  IF_SET_DO: {
    parameters: ["VARIABLE", "ACTION"],
    action: (story, parameters) => {
      if (!parameters || parameters.length < 2) {
        console.log("To few parameters for IF_SET_DO action", parameters);
        return;
      }
      if (!supported_actions?.[parameters[1]]) {
        console.log("No such action", parameters[1]);
        return;
      }
      if (story?.state?.variables?.[parameters[0]]) {
        console.debug(
          "chaining to action",
          parameters[1],
          "with parameters",
          parameters.slice(2)
        );
        return supported_actions[parameters[1]].action(
          story,
          parameters.slice(2)
        );
      }
    },
  },
  IF_NOT_SET_DO: {
    parameters: ["VARIABLE", "ACTION"],
    action: (story, parameters) => {
      if (!parameters || parameters.length < 2) {
        console.log("To few parameters for IF_NOT_SET_DO action", parameters);
        return;
      }
      if (!supported_actions?.[parameters[1]]) {
        console.log("No such action", parameters[1]);
        return;
      }
      if (!story?.state?.variables?.[parameters[0]]) {
        console.debug(
          "chaining to action",
          parameters[1],
          "with parameters",
          parameters.slice(2)
        );
        return supported_actions[parameters[1]].action(
          story,
          parameters.slice(2)
        );
      }
    },
  },
  ADD_CHOICE: {
    parameters: ["SECTION", "STRING"],
    action: (story, parameters) => {
      if (!parameters || parameters.length < 2) {
        console.log("To few parameters for ADD_CHOICE action", parameters);
        return;
      }
      if (!story?.state?.current_section) {
        console.log(
          "No current section to add choice for ADD_CHOICE action",
          story.state
        );
        return;
      }

      if (!story.sections[story.state.current_section].next) {
        story.sections[story.state.current_section].next = [];
      }
      for (const choice of story.sections[story.state.current_section].next) {
        if (choice?.next == parameters[0] && choice?.text == parameters[1]) {
          // choice already exists
          return;
        }
      }
      story.sections[story.state.current_section].next.push({
        text: parameters[1],
        next: parameters[0],
      });
    },
  },
  REMOVE_CHOICE: {
    parameters: ["SECTION"],
    action: (story, parameters) => {
      if (!parameters || parameters.length < 1) {
        console.log("To few parameters for REMOVE_CHOICE action", parameters);
        return;
      }
      if (!story?.state?.current_section) {
        console.log(
          "No current section to add choice for IF_SET_ADD_CHOICE action",
          story.state
        );
        return;
      }

      const choices = story.sections[story.state.current_section].next;
      for (const choice of choices) {
        if (choice.next == parameters[0]) {
          console.debug(
            "Removing choice",
            choice,
            "at position",
            choices.indexOf(choice),
            "in",
            choices
          );
          story.sections[story.state.current_section].next.splice(
            choices.indexOf(choice),
            1
          );
          return;
        }
      }
    },
  },
  IF_SET_ADD_CHOICE: {
    parameters: ["VARIABLE", "SECTION", "STRING"],
    action: (story, parameters) => {
      if (!parameters || parameters.length < 3) {
        console.log(
          "To few parameters for IF_SET_ADD_CHOICE action",
          parameters
        );
        return;
      }
      if (!story?.state?.current_section) {
        console.log(
          "No current section to add choice for IF_SET_ADD_CHOICE action",
          story.state
        );
        return;
      }
      if (story?.state?.variables?.[parameters[0]]) {
        if (!story.sections[story.state.current_section].next) {
          story.sections[story.state.current_section].next = [];
        }
        for (const choice of story.sections[story.state.current_section].next) {
          if (choice?.next == parameters[1] && choice?.text == parameters[2]) {
            // choice already exists
            return;
          }
        }
        story.sections[story.state.current_section].next.push({
          text: parameters[2],
          next: parameters[1],
        });
      }
    },
  },
  IF_SET_REMOVE_CHOICE: {
    parameters: ["VARIABLE", "SECTION"],
    action: (story, parameters) => {
      if (!parameters || parameters.length < 2) {
        console.log(
          "To few parameters for IF_SET_REMOVE_CHOICE action",
          parameters
        );
        return;
      }
      if (!story?.state?.current_section) {
        console.log(
          "No current section to add choice for IF_SET_ADD_CHOICE action",
          story.state
        );
        return;
      }
      if (story?.state?.variables?.[parameters[0]]) {
        const choices = story.sections[story.state.current_section].next;
        for (const choice of choices) {
          if (choice.next == parameters[1]) {
            story.sections[story.state.current_section].next = choices.splice(
              choices.indexOf(choice),
              1
            );
          }
        }
      }
    },
  },
};

function set_story_variable(story, key, value) {
  if (!story.state) {
    story.state = {};
  }
  if (!story.state.variables) {
    story.state.variables = {};
  }
  story.state.variables[key] = value;
  console.debug(`Setting ${key} = ${value}`);
}

function set_variable(story, parameters) {
  if (!parameters || parameters.length < 2) {
    console.log("To few parameters to set variable", parameters);
    return;
  }
  set_story_variable(story, parameters[0], parameters[1]);
}

function add_to_variable(story, parameters) {
  if (!parameters || parameters.length < 2) {
    console.log("To few parameters to add to variable", parameters);
    return;
  }

  set_story_variable(
    story,
    parameters[0],
    String(Number(story?.state?.variables?.[parameters[0]]) + Number(parameters[1]))
  );
}

function compare(value1, operator, value2) {
  let result;
  switch (operator) {
    case "=":
      result = value1 == value2;
      break;
    case "<":
      result = Number(value1) < Number(value2);
      break;
    case ">":
      result = Number(value1) > Number(value2);
      break;
    case "!=":
      result = String(value1) != String(value2);
      break;
    case ">=":
      result = Number(value1) >= Number(value2);
      break;
    case "<=":
      result = Number(value1) <= Number(value2);
      break;
    default:
      console.log("Unsupported operator", operator);
      return false;
  }
  console.log(`Comparison result for ${value1} ${operator} ${value2}: ${result}`);
  return result;
}

