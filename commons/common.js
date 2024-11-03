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
      if (!story?.state?.currnet_section) {
        console.log(
          "No current section to add choice for IF_SET_ADD_CHOICE action",
          story.state
        );
        return;
      }
      if (story?.state?.variables?.[parameters[0]]) {
        story.sections[story.state.currnet_section].next.push({
          text: parameters[2],
          next: parameters[1],
        });
      }
    },
  },
};

function set_variable(story, parameters) {
  if (!parameters || parameters.length < 2) {
    console.log("To few parameters to set variable", parameters);
    return;
  }
  if (!story.state) {
    story.state = {};
  }
  if (!story.state.variables) {
    story.state.variables = {};
  }
  story.state.variables[parameters[0]] = parameters[1];
}
