import cytoscape from "./cytoscape.esm.min.js";
import { toast_alert } from "./toast.js";

var story = {};

const text_area = document.getElementById("text");
const text_label = document.getElementById("text_label");
const text_containers = document.getElementsByClassName(
  "text_editor_container"
);
const img_container = document.getElementById("img_container");
const delete_button = document.getElementById("delete_button");
const add_node_button = document.getElementById("add_node_button");
const add_edge_button = document.getElementById("add_edge_button");
const download_button = document.getElementById("download_button");
const load_button = document.getElementById("load_button");
const clear_all_button = document.getElementById("clear_all_button");
const add_media_button = document.getElementById("add_media_button");

const variables_menu = document.getElementById("variables_menu");

var active_element = null;
text_editor_hide();

var cy = cytoscape({
  container: document.getElementById("cy"),

  boxSelectionEnabled: false,
  autounselectify: false,

  style: cytoscape
    .stylesheet()
    .selector("node")
    .css({
      height: 80,
      width: 80,
      "border-width": 3,
      "border-opacity": 0.5,
      content: "data(id)",
      "text-valign": "center",
      "text-halign": "center",
    })
    .selector("edge")
    .css({
      "curve-style": "bezier",
      width: 6,
      "target-arrow-shape": "triangle",
      "line-color": "#ffaaaa",
      "target-arrow-color": "#ffaaaa",
    }),
}); // cy init

function display_adventure_graph(adventure, cyto) {
  console.debug("drawing adventure graph", adventure);
  cyto.remove("node");

  for (const id in adventure.sections) {
    const section = adventure.sections[id];
    section.id = id;
    cyto.add([{ group: "nodes", data: section }]);
    const new_node = cyto.getElementById(section.id);

    new_node.on("tap", function (evt) {
      text_editor_load(section);
    });

    console.log("node added", new_node);
  }

  for (const id in adventure.sections) {
    const section = adventure.sections[id];
    if (!section.next) {
      continue;
    }
    for (const next of section.next) {
      const edge_id = section.id + "-" + next.next;
      cyto.add([
        {
          group: "edges",
          data: {
            id: edge_id,
            source: section.id,
            target: next.next,
          },
        },
      ]);
      const new_edge = cyto.getElementById(edge_id);

      new_edge.on("tap", function (evt) {
        text_editor_load(next);
      });

      console.log("edge added", new_edge);
    }
  }

  const layout = cyto.layout({
    name: "breadthfirst",
    directed: true,
    padding: 10,
  });
  layout.run();
  cyto.fit();

  load_variables_menu();
}
function edit_variable(variable) {
  let new_value = prompt(
    `Set variable ${variable} with current value '${story?.state?.variables?.[variable]}'`
  );
  if (new_value) {
    story.state.variables[variable] = new_value;
  }
}
function add_variable() {
  let new_var = prompt("Name of the new variable:");
  if (!story.state) {
    story.state = {};
  }
  if (!story.state.variables) {
    story.state.variables = {};
  }
  story.state.variables[new_var] = "";
  load_variables_menu();
}

function add_menu_item(menu, text, on_click) {
  const new_li = menu.appendChild(document.createElement("li"));
  const new_a = new_li.appendChild(document.createElement("a"));
  new_a.href = "#";
  new_a.classList.add("dropdown-item");
  new_a.innerText = text;
  new_a.onclick = on_click;
}

function load_variables_menu() {
  variables_menu.innerHTML = "";
  if (story?.state?.variables) {
    for (const variable of Object.keys(story?.state?.variables)) {
      add_menu_item(variables_menu, variable, () => edit_variable(variable));
    }
  }
  add_menu_item(variables_menu, "Add Variable", add_variable);
}

function text_editor_load(element) {
  if (!element) {
    console.error("Can not load empty element into text editor");
    return;
  }

  const elements_section = find_elements_section(element);

  if (!elements_section) {
    console.error("No (parent) section for ", element);
    return;
  }

  text_label.innerText = "Story for Section " + elements_section.id;

  if (element.next && typeof element.next === "string") {
    text_label.innerText =
      "Choice going from Section " +
      elements_section.id +
      " to Section " +
      element.next;
  } else {
    cy.$("node").unselect();
    cy.getElementById(elements_section.id).select();
  }

  for (const text_container of text_containers) {
    text_container.style.display = "flex";
  }
  text_area.value = "";
  active_element = element;
  if (element?.text_lines) {
    text_area.value = element.text_lines.join("\n");
  }
  if (element?.text) {
    text_area.value = element.text;
  }
  if (element?.media?.type === "image") {
    img_container.style.display = "block";
    const img = img_container?.getElementsByTagName("img")?.[0];
    if (img) {
      img.src = element?.media?.src;
    }
    add_media_button.innerHTML = "Remove Media";
  } else {
    img_container.style.display = "none";
    add_media_button.innerHTML = "Add Media";
  }
}

function text_editor_hide() {
  for (const text_container of text_containers) {
    text_container.style.display = "none";
  }
}

function handle_text_change(event) {
  if (!active_element) {
    return;
  }
  if (active_element?.text_lines) {
    active_element.text_lines = text_area.value.split("\n");
  } else {
    active_element.text = text_area.value;
  }
}

function find_elements_section(element) {
  if (story?.sections?.[element?.id]) {
    return story?.sections?.[element?.id];
  }

  for (const id in story?.sections) {
    const section = story.sections[id];
    if (!section?.next) {
      continue;
    }
    if (section.next.includes(element)) {
      return section;
    }
  }
  return null;
}

function handle_delete() {
  if (!active_element) {
    return;
  }

  var deleted_section_id = null;
  if (story?.sections?.[active_element?.id]) {
    delete story.sections[active_element.id];
    console.debug("deleted section", active_element);
    deleted_section_id = active_element.id;
  }

  for (const id in story?.sections) {
    const section = story.sections[id];
    if (!section?.next) {
      continue;
    }
    if (section.next.includes(active_element)) {
      section.next.splice(section.next.indexOf(active_element), 1);
      console.debug("deleted link", active_element);
      break;
    }
    for (var i = 0; i < section.next.length; i++) {
      if (section.next[i].next === deleted_section_id) {
        section.next.splice(i, 1);
        i--;
      }
    }
  }
  text_editor_hide();
  display_adventure_graph(story, cy);
}

function handle_add_node() {
  if (!story) {
    story = {};
  }
  let next_id = 1;
  if (!story.sections) {
    story.sections = {};
  } else {
    next_id = Math.max(...Object.keys(story.sections)) + 1;
  }
  story.sections[next_id] = {
    id: next_id,
    text_lines: [""],
  };

  display_adventure_graph(story, cy);
  text_editor_load(story.sections[next_id]);
}

function handle_add_edge() {
  if (
    !active_element ||
    !active_element?.id ||
    !story?.sections?.[active_element.id]
  ) {
    toast_alert("Please select the starting node, than click add edge.");
    return;
  }

  let targetId = prompt(
    "Please enter the target for the edge starting at " + active_element?.id
  );
  if (!targetId) {
    return;
  }

  if (!active_element?.next) {
    active_element.next = [];
  }

  active_element.next.push({
    text: "",
    next: targetId,
  });

  display_adventure_graph(story, cy);
}

function download_graph() {
  var dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(story, null, 2));

  var dlAnchorElem = document.createElement("a");
  dlAnchorElem.style.display = "none";
  document.body.appendChild(dlAnchorElem);

  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "adventure_graph.json");
  dlAnchorElem.click();
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

function load_graph() {
  load_file((content) => {
    story = JSON.parse(content);
    display_adventure_graph(story, cy);
  });
}

function add__or_remove_media() {
  if (active_element?.media?.type) {
    active_element.media = {};
    text_editor_load(active_element);
  } else {
    load_file((content) => {
      if (!active_element || !story?.sections?.[active_element.id]) {
        alert("Please select section to add media to.");
        return;
      }

      active_element.media = {
        type: "image",
        src: content,
      };
      text_editor_load(active_element);
    }, true);
  }
}

function clear_all() {
  if (
    confirm("Really start a new story? Unsaved state will be lost.") != true
  ) {
    return;
  }
  story = {};
  display_adventure_graph(story, cy);
  text_editor_hide();
}

function paste_image(event) {
  let clipboardData = event.clipboardData || window.clipboardData;

  let item = clipboardData?.items?.[0];
  if (item?.type?.indexOf("image") === 0) {
    // Get the blob of the image
    var blob = item.getAsFile();

    // Create a file reader
    var reader = new FileReader();

    // Set the onload event handler
    reader.onload = function (loadEvent) {
      // Get the data URL of the image
      let content = loadEvent.target.result;

      active_element.media = {
        type: "image",
        src: content,
      };
      text_editor_load(active_element);
    };
    // Read the blob as a data URL
    reader.readAsDataURL(blob);
  }
}

function handle_global_key_down(event) {
  console.log("keydown", event);

  if (!active_element) {
    return;
  }

  const active_section = find_elements_section(active_element);
  if (!active_section) {
    return;
  }

  if (event.key === "ArrowDown") {
    if (!active_section?.next) {
      return;
    }
    active_element = story.sections[active_section.next[0].next];
    text_editor_load(active_element);
    return;
  }

  if (!story?.sections) {
    return;
  }
  var parent_section = null;
  var sibbling_index = null;
  for (const section_id of Object.keys(story.sections)) {
    const section = story.sections[section_id];
    if (!section?.next) {
      continue;
    }
    for (var i = 0; i < section.next.length; i++) {
      const choice = section.next[i];
      if (choice.next === active_element.id) {
        parent_section = section;
        sibbling_index = i;
        break;
      }
    }
    if (parent_section) {
      break;
    }
  }

  if (!parent_section) {
    return;
  }

  if (event.key === "ArrowUp") {
    text_editor_load(parent_section);
    return;
  }

  if (event.key === "ArrowLeft") {
    if (sibbling_index > 0) {
      text_editor_load(
        story.sections[parent_section.next[sibbling_index - 1].next]
      );
      return;
    }
  }
  if (event.key === "ArrowRight") {
    if (sibbling_index < parent_section.next.length - 1) {
      text_editor_load(
        story.sections[parent_section.next[sibbling_index + 1].next]
      );
      return;
    }
  }
}

text_area.addEventListener("change", handle_text_change);

text_area.addEventListener("paste", paste_image);

delete_button.addEventListener("click", handle_delete);
add_node_button.addEventListener("click", handle_add_node);
add_edge_button.addEventListener("click", handle_add_edge);
download_button.addEventListener("click", download_graph);
load_button.addEventListener("click", load_graph);
clear_all_button.addEventListener("click", clear_all);
add_media_button.addEventListener("click", add__or_remove_media);

text_area.addEventListener("keydown", (event) => {
  event.stopPropagation();
});

document.addEventListener("keydown", handle_global_key_down);

async function load_example() {
  const url = "../stories/example_story.json";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    story = await response.json();
  } catch (error) {
    console.error(error.message);
  }
}

load_example().then(() => {
  display_adventure_graph(story, cy);
});
