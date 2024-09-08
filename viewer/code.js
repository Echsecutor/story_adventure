import { toast_alert, toast_ok } from "./toast.js";

var story = {};

const viewer_states = Object.freeze({
  MENU: "MENU",
  PLAYING: "PLAYING",
});

let current_viewer_state = viewer_states.MENU;

const menu_container = document.getElementById("menu_container");
const story_container = document.getElementById("story_container");

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

function load_graph() {
  load_file((content) => {
    try {
      story = JSON.parse(content);
    } catch (error) {
      toast_alert("Not a valid json");
    }
    start_playing();
  });
}

function start_playing() {
  if (!story?.sections?.[0]?.id) {
    toast_alert("No Story loaded");
    current_viewer_state = viewer_states.MENU;
    show_ui_components_according_to_state();
    return;
  }
  if (!story?.state) {
    story.state = {};
  }
  if (!story?.state?.current_section) {
    story.state.current_section = story.sections[0].id;
  }

  

  toast_ok("Story Adventure Loaded");
  current_viewer_state = viewer_states.PLAYING;
  show_ui_components_according_to_state();
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

document.getElementById("load_button").addEventListener("click", load_graph);

show_ui_components_according_to_state();
