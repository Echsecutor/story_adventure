import { toast_alert, toast_ok } from "./toast.js";
import { marked } from "./marked.esm.js";
import DOMPurify from "./purify.es.mjs";
import { supported_actions } from "./common.js";

var story = {};

const viewer_states = Object.freeze({
  MENU: "MENU",
  PLAYING: "PLAYING",
});

const hot_keys = {
  b: {
    description: "back",
    action: one_step_back,
  },
};

let current_viewer_state = viewer_states.MENU;

const menu_container = document.getElementById("menu_container");
const story_container = document.getElementById("story_container");
const story_text = document.getElementById("story_text");
const choices_row = document.getElementById("choices_row");
const background_image = document.getElementById("background_image");

function one_step_back() {
  if (!story?.state?.history || story.state.history.length < 1) {
    return;
  }
  load_section(story.state.history.pop(), false);
}

function load_file(content_handler, read_as_data) {
  var input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    var file = e.target.files[0];
    var reader = new FileReader();
    if (read_as_data) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file, "UTF-8");
    }
    reader.onload = (readerEvent) => {
      const content = readerEvent.target.result;
      //console.log(content);
      content_handler(content);
    };
  };
  input.click();
}

function load_graph_from_file() {
  load_file((content) => {
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
    });
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
}

function replace_variables(text, variables) {
  if (!variables || !text) {
    return text;
  }
  var re = text;
  for (const key in variables) {
    re = re.replaceAll("${" + key + "}", variables[key]);
  }
  return re;
}

function execute_actions(script) {
  for (const action of script) {
    if (action.action === "INPUT") {
      if (!action?.parameters || action.parameters.length < 2) {
        console.error("Need to parameters to ask for input", action);
        return;
      }
      const user_input = prompt(action.parameters[1]);
      supported_actions[action.action].action(story, [
        action.parameters[0],
        user_input,
      ]);
      return;
    }
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

  const section = story.sections[id];

  let text = "";
  if (section?.text_lines) {
    text = section.text_lines.join("\n");
  } else if (section?.text) {
    text = section.text;
  }
  if (!text) {
    toast_alert("This section has no text");
  }

  text = replace_variables(text, story.state?.variables);

  story_text.innerHTML = DOMPurify.sanitize(marked.parse(text));

  if (section?.media?.type === "image" && section?.media?.src) {
    background_image.src = section.media.src;
    if (!background_image.style) {
      background_image.style = {};
    }
    background_image.style.display = "inline-block";
  }
  if (section.script) {
    execute_actions(section.script);
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
        button.appendChild(document.createTextNode(choice.text));
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

function show_ui_components_according_to_state() {
  if (current_viewer_state == viewer_states.MENU) {
    menu_container.style.display = "block";
    story_container.style.display = "none";
    return;
  }
  if (current_viewer_state == viewer_states.PLAYING) {
    menu_container.style.display = "none";
    story_container.style.display = "block";
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
    document.activeElement.nodeName === "BUTTON"
  ) {
    return;
  }
  const section = story.sections[story.state.current_section];
  if (!section?.next) {
    return;
  }
  if (section.next.length != 1) {
    return;
  }
  load_section(section.next[0].next);
}

function handle_global_key_down(event) {
  if (
    document.activeElement.nodeName === "INPUT" ||
    document.activeElement.nodeName === "TEXTAREA"
  ) {
    return;
  }
  for (const key of Object.keys(hot_keys)) {
    if (event.key === key) {
      hot_keys[key].action();
      event.stopPropagation();
    }
  }
}

function on_load() {
  show_ui_components_according_to_state();
  read_query_params();
}

document
  .getElementById("load_button")
  .addEventListener("click", load_graph_from_file);

document.addEventListener("click", handle_global_click);
document.addEventListener("keydown", handle_global_key_down);

on_load();
