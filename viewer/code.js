import { toast_alert, toast_ok } from "./toast.js";
import { marked } from "./marked.esm.js";
import DOMPurify from "./purify.es.mjs";
import { supported_actions } from "./common.js";
import {
  replace_variables,
  get_text_from_section,
  create_element_with_classes_and_attributes,
  load_file,
  get_file_safe_title,
} from "./utils.js";

import saveAs from "./file-saver.js";

var story = {};

const viewer_states = Object.freeze({
  MENU: "MENU",
  PLAYING: "PLAYING",
});

const hot_keys = {
  b: {
    description: "One step back",
    action: one_step_back,
    aliases: ["ArrowLeft", "ArrowUp"],
  },
  n: {
    description: "Proceed to next story section (if there is only one choice)",
    action: one_step_forward,
    aliases: ["ArrowRight", "ArrowDown", "Spacebar", " "],
  },
  s: {
    description: "Save your progress for the current adventure",
    action: () => {
      var blob = new Blob(
        [
          JSON.stringify(
            {
              meta: story.meta,
              state: story.state,
            },
            null,
            2
          ),
        ],
        {
          type: "text/json;charset=utf-8",
        }
      );
      return saveAs(blob, get_file_safe_title(story) + "_save.json");
    },
  },
  l: {
    description:
      "Load progress for the current adventure. (load the adventure first)",
    action: () => {
      load_file((content) => {
        const saved = JSON.parse(content);
        if (!story?.meta?.title) {
          toast_alert("Please load the story first!");
          return;
        }
        if (story.meta.title != saved.meta?.title) {
          toast_alert(
            `The loaded story is '${story.meta.title}' but the save game is for '${saved.meta?.title}'`
          );
          return;
        }
        story.state = saved.state;
        start_playing();
      });
    },
  },
  f: {
    description: "Toggle full screen",
    action: () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
      }
      const element = document.body;
      const requestMethod =
        element.requestFullScreen ||
        element.webkitRequestFullScreen ||
        element.mozRequestFullScreen ||
        element.msRequestFullScreen;
      if (requestMethod) {
        // Native full screen.
        requestMethod.call(element);
      }
    },
  },
  h: {
    description: "Toggle show/hide text",
    action: () => {
      if (story_container.classList.contains("d-none")) {
        story_container.classList.remove("d-none");
      } else {
        story_container.classList.add("d-none");
      }
    },
  },
  "?": {
    description: "Show help",
    action: () => {
      help_modal.show();
    },
  },
};

let current_viewer_state = viewer_states.MENU;

const story_container = document.getElementById("story_container");
const story_text = document.getElementById("story_text");
const choices_row = document.getElementById("choices_row");
const background_image = document.getElementById("background_image");
const spinner = document.getElementById("spinner");
const help_modal = new bootstrap.Modal(document.getElementById("help_modal"));

function one_step_forward() {
  const section = story.sections[story.state.current_section];
  if (!section?.next) {
    return;
  }
  if (section.next.length != 1) {
    return;
  }
  load_section(section.next[0].next);
}

function one_step_back() {
  if (!story?.state?.history || story.state.history.length < 1) {
    return;
  }
  load_section(story.state.history.pop(), false);
}

function load_graph_from_file() {
  load_file((content) => {
    show_spinner();
    try {
      story = JSON.parse(content);
    } catch (error) {
      toast_alert("Not a valid json");
    }
    start_playing();
  });
}

function load_graph_from_url(url) {
  toast_ok("Loading story from " + url);
  show_spinner();

  fetch(url)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((json) => {
      story = json;
      start_playing();
    })
    .catch((error) => {
      toast_alert("Error loading story from " + url);
      console.error("error loading url:", url, error);
    })
    .finally(hide_spinner);
}

function start_playing() {
  if (!story?.sections) {
    toast_alert("No Story loaded");
    current_viewer_state = viewer_states.MENU;
    show_ui_components_according_to_state();
    return;
  }
  if (!story?.state) {
    story.state = {};
  }
  if (
    !story?.state?.current_section ||
    !story?.sections?.[story.state.current_section]
  ) {
    if (!Object.keys(story.sections)) {
      toast_alert("This story has no sections. Please load a different one.");
      return;
    }
    story.state.current_section = Object.keys(story.sections)[0];
  }

  load_section(story.state.current_section);

  toast_ok("Story Adventure Loaded");
  current_viewer_state = viewer_states.PLAYING;
  show_ui_components_according_to_state();
  toast_ok("Press '?' to display the viewer help.");
  hide_spinner();
}

function execute_actions(script) {
  for (const action of script) {
    if (!(action.action in supported_actions)) {
      console.error("No such action", action.action);
      return;
    }
    supported_actions[action.action].action(story, action.parameters);
  }
}

function load_section(id, add_current_section_to_history = true) {
  if (!story.state) {
    story.state = {};
  }
  if (!story.state.history) {
    story.state.history = [];
  }
  if (add_current_section_to_history) {
    story.state.history.push(story.state.current_section);
  }
  story.state.current_section = id;
  if (!story?.sections?.[id]) {
    toast_alert(`Section ${id} is missing from the story`);
    return;
  }

  story_container.classList.remove("d-none");

  const section = story.sections[id];

  if (section.script) {
    execute_actions(section.script);
  }

  const text = get_text_from_section(section, story.state?.variables);

  if (!text) {
    toast_alert("This section has no text");
  }
  story_text.innerHTML = DOMPurify.sanitize(marked.parse(text));

  if (section?.media?.type === "image" && section?.media?.src) {
    background_image.src = section.media.src;
    if (!background_image.style) {
      background_image.style = {};
    }
    background_image.classList.remove("d-none");
  }

  choices_row.innerHTML = "";
  if (section?.next) {
    for (const choice of section.next) {
      const col = choices_row.appendChild(document.createElement("div"));
      col.className = "col";
      const button = col.appendChild(document.createElement("button"));
      button.className = "btn btn-primary";
      button.type = "button";

      if (choice?.text) {
        button.appendChild(
          document.createTextNode(
            replace_variables(choice.text, story.state?.variables)
          )
        );
      } else {
        button.innerHTML = '<i class="bi bi-arrow-right-circle-fill"></i>';
      }

      button.addEventListener("click", (event) => {
        load_section(choice.next);
        event.stopPropagation();
      });
    }
  }
}

function display_hotkeys() {
  const explain_hotkeys = document.getElementById("explain_hotkeys");

  explain_hotkeys.innerHTML = "";
  explain_hotkeys.appendChild(
    create_element_with_classes_and_attributes("p", {
      innerHTML: "Use the following hotkeys anywhere in the viewer:",
    })
  );
  const table_body = explain_hotkeys
    .appendChild(
      create_element_with_classes_and_attributes(
        "table",
        {
          class_list: ["table"],
        },
        create_element_with_classes_and_attributes(
          "thead",
          {},
          create_element_with_classes_and_attributes(
            "tr",
            {},
            create_element_with_classes_and_attributes("th", {
              attributes: { scope: "col" },
              innerHTML: "Key",
            }),
            create_element_with_classes_and_attributes("th", {
              attributes: { scope: "col" },
              innerHTML: "Description",
            })
          )
        )
      )
    )
    .appendChild(create_element_with_classes_and_attributes("tbody"));

  for (const key in hot_keys) {
    const description = hot_keys[key]?.description;
    var keys = [key];
    if (hot_keys[key]?.aliases) {
      keys.push(...hot_keys[key]?.aliases);
    }

    table_body.appendChild(
      create_element_with_classes_and_attributes(
        "tr",
        {},
        create_element_with_classes_and_attributes("td", {
          innerHTML: `<strong>${keys.join(", ")}</strong>`,
        }),
        create_element_with_classes_and_attributes("td", {
          innerHTML: description,
        })
      )
    );
  }
}

function show_ui_components_according_to_state() {
  const menu_container = document.getElementById("menu_container");
  if (current_viewer_state == viewer_states.MENU) {
    if (!story_container.classList.contains("d-none")) {
      story_container.classList.add("d-none");
    }
    display_hotkeys();
    menu_container.classList.remove("d-none");
    return;
  }
  if (current_viewer_state == viewer_states.PLAYING) {
    if (!menu_container.classList.contains("d-none")) {
      menu_container.classList.add("d-none");
    }
    story_container.classList.remove("d-none");
    return;
  }
}

function read_query_params() {
  let params = new URL(document.location.toString())?.searchParams;
  let load = params?.get("load");
  if (load) {
    load_graph_from_url(load);
  }
}

function handle_global_click() {
  if (
    document.activeElement.nodeName === "INPUT" ||
    document.activeElement.nodeName === "BUTTON" ||
    !story?.state?.current_section
  ) {
    return;
  }
  one_step_forward();
}

function handle_global_key_down(event) {
  if (
    document.activeElement.nodeName === "INPUT" ||
    document.activeElement.nodeName === "TEXTAREA"
  ) {
    return;
  }
  for (const key of Object.keys(hot_keys)) {
    if (event.key === key || hot_keys[key]?.aliases?.includes(event.key)) {
      console.debug("Hotkey pressed", event.key, hot_keys[key]);
      hot_keys[key].action();
      event.stopPropagation();
      break;
    }
  }
  console.debug(`No hot key for '${event.key}'`);
}

function show_spinner() {
  spinner.classList.remove("d-none");
}

function hide_spinner() {
  if (!spinner.classList.contains("d-none")) {
    spinner.classList.add("d-none");
  }
}

function overwrite_actions() {
  supported_actions["INPUT"].action = (st, parameters) => {
    if (!parameters || parameters.length < 2) {
      console.error("Need to parameters to ask for input", action);
      return;
    }
    const user_input = prompt(parameters[1]);
    supported_actions["SET"].action(st, [parameters[0], user_input]);
  };
}

function on_load() {
  overwrite_actions();
  show_ui_components_according_to_state();
  read_query_params();
}

document
  .getElementById("load_button")
  .addEventListener("click", load_graph_from_file);

document.addEventListener("click", handle_global_click);
document.addEventListener("keydown", handle_global_key_down);

on_load();
