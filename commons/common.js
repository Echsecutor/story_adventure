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
    String(Number(parameters[0]) + Number(parameters[1]))
  );
}
