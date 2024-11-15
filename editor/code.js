import cytoscape from "./cytoscape.esm.min.js";
import { toast_alert, toast_ok } from "./toast.js";
import { supported_actions } from "./common.js";

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
const load_button = document.getElementById("load_button");
const clear_all_button = document.getElementById("clear_all_button");
const add_media_button = document.getElementById("add_media_button");
const section_select = document.getElementById("section_select");
const action_div = document.getElementById("action_div");

const variables_menu = document.getElementById("variables_menu");

const hot_keys = {
  s: {
    description: "Add new Section",
    action: handle_add_node,
  },
  m: {
    description: "Add Media",
    action: add_or_remove_media,
  },
};

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
    .selector(".leave")
    .style({
      shape: "round-hexagon",
    })
    .selector(".root")
    .style({
      shape: "diamond",
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

function add_node(section) {
  cy.add([{ group: "nodes", data: section }]);
  const new_node = cy.getElementById(section.id);

  new_node.on("tap", function (evt) {
    text_editor_load(section);
  });

  console.log("node added", new_node);

  const section_option = section_select.appendChild(
    document.createElement("option")
  );
  section_option.text = section.id;
  section_option.value = section.id;
}

function add_edge(section, choice) {
  const edge_id = section.id + "-" + choice.next;
  cy.add([
    {
      group: "edges",
      data: {
        id: edge_id,
        source: section.id,
        target: choice.next,
      },
    },
  ]);
  const new_edge = cy.getElementById(edge_id);

  new_edge.on("tap", function (evt) {
    text_editor_load(choice);
  });

  console.log("edge added", new_edge);
}

function redraw_adventure_graph() {
  console.debug("drawing adventure graph", story);
  cy.remove("node");
  section_select.innerHTML = "";

  const section_option = section_select.appendChild(
    document.createElement("option")
  );
  section_option.text = "New Section";
  section_option.value = "new_section";

  for (const id in story.sections) {
    const section = story.sections[id];
    section.id = id;
    add_node(section);
  }

  for (const id in story.sections) {
    const section = story.sections[id];
    if (!section.next) {
      continue;
    }
    for (const next of section.next) {
      add_edge(section, next);
    }
  }

  cy.$("node").leaves().addClass("leave");
  cy.$("node").roots().addClass("root");

  const layout = cy.layout({
    name: "breadthfirst",
    directed: true,
    padding: 10,
  });
  layout.run();
  cy.fit();
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

function add_action_select_to(col, action) {
  const select = col.appendChild(document.createElement("select"));
  select.classList.add("form-select");
  for (const supported_action of Object.keys(supported_actions)) {
    const option = select.appendChild(document.createElement("option"));
    select.classList.add("form-select");
    option.text = supported_action;
    option.value = supported_action;
  }
  select.value = action.action;
  select.onchange = () => {
    action.action = select.options[select.selectedIndex].value;
    action.parameters = [];
    for (const parameter_type of supported_actions[action.action].parameters) {
      action.parameters.push("");
    }
    console.debug("Changed to action", action);
    text_editor_load(active_element);
  };
}

function add_parameter(col, action, parameter_index) {
  const parameter_type =
    supported_actions[action.action].parameters[parameter_index];
  if (parameter_type == "STRING") {
    const input = col.appendChild(document.createElement("input"));
    input.type = "text";
    input.classList.add("form-control");
    input.value = action.parameters[parameter_index];
    input.addEventListener("change", () => {
      action.parameters[parameter_index] = input.value;
      console.debug("changed action", action);
    });
  }
  if (parameter_type == "VARIABLE") {
    const select = col.appendChild(document.createElement("select"));
    select.classList.add("form-select");
    if (!story?.state?.variables) {
      return;
    }
    for (const variable of Object.keys(story.state.variables)) {
      const option = select.appendChild(document.createElement("option"));
      select.classList.add("form-select");
      option.text = variable;
      option.value = variable;
    }
    select.value = action.parameters[parameter_index];
    select.onchange = () => {
      action.parameters[parameter_index] =
        select.options[select.selectedIndex].value;
    };
  }
  if (parameter_type == "SECTION") {
    const select = col.appendChild(document.createElement("select"));
    select.classList.add("form-select");
    for (const section_key of Object.keys(story.sections)) {
      const option = select.appendChild(document.createElement("option"));
      select.classList.add("form-select");
      option.text = story.sections[section_key].id;
      option.value = story.sections[section_key].id;
    }
    select.value = action.parameters[parameter_index];
    select.onchange = () => {
      action.parameters[parameter_index] =
        select.options[select.selectedIndex].value;
    };
  }
}

function load_actions(section) {
  action_div.innerHTML = `
      <div class="row">
          <div class="col">
            <button type="button" id="add_action_button" class="btn btn-primary">Add Action</button>
          </div>
        </div>
    `;
  document
    .getElementById("add_action_button")
    .addEventListener("click", add_action);

  if (!section?.script) {
    console.debug("No scripts for section", section.id);
    return;
  }
  for (const action of section.script) {
    const row = action_div.appendChild(document.createElement("div"));
    row.classList.add("row");
    const first_col = row.appendChild(document.createElement("div"));
    first_col.classList.add("col");
    add_action_select_to(first_col, action);

    for (let i = 0; i < action.parameters.length; i++) {
      const para_col = row.appendChild(document.createElement("div"));
      para_col.classList.add("col");
      add_parameter(para_col, action, i);
    }
  }
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
    // active element is an edge
    text_label.innerText =
      "Choice going from Section " +
      elements_section.id +
      " to Section " +
      element.next;
    if (!action_div.classList.contains("d-none")) {
      action_div.classList.add("d-none");
    }
  } else {
    // active element is a node
    cy.$("node").unselect();
    cy.getElementById(elements_section.id).select();
    action_div.classList.remove("d-none");
    load_actions(element);
  }

  for (const text_container of text_containers) {
    text_container.classList.remove("d-none");
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
    if (!text_container.classList.contains("d-none")) {
      text_container.classList.add("d-none");
    }
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
  console.log("no section for element");
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
  redraw_adventure_graph();
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

  add_node(story.sections[next_id]);

  //redraw_adventure_graph();
  text_editor_load(story.sections[next_id]);
  return next_id;
}

function handle_add_edge() {
  const elements_section = find_elements_section(active_element);

  if (!elements_section) {
    toast_alert("Please select the starting node, than add edge.");
    return;
  }

  let targetId = section_select.options[section_select.selectedIndex].value;
  if (!targetId) {
    return;
  }
  if (targetId == "new_section") {
    targetId = handle_add_node();
  }

  if (!elements_section?.next) {
    elements_section.next = [];
  }

  elements_section.next.push({
    text: "",
    next: targetId,
  });

  add_edge(
    elements_section,
    elements_section.next[elements_section.next.length - 1]
  );
}

function download_media_in_section(
  current_index,
  section_ids,
  finall_callback
) {
  console.debug("current_index", current_index);
  if (current_index >= section_ids.length) {
    finall_callback();
    return;
  }

  const section = story.sections[section_ids[current_index]];
  if (section?.media?.src.startsWith?.("http")) {
    console.debug(`Embedding ${section.media.src}`);
    fetch(section.media.src)
      .then((response) => {
        if (response.status === 200) {
          return response.blob();
        } else {
          console.log(
            `Error ${response.status} fetching pic ${section.media.src}`
          );
        }
      })
      .then((imageBlob) => {
        read_blob_and_handle(
          imageBlob,
          (content) => {
            section.media.src = content;
            download_media_in_section(
              current_index + 1,
              section_ids,
              finall_callback
            );
          },
          true
        );
      });
  } else {
    download_media_in_section(current_index + 1, section_ids, finall_callback);
  }
}

function download_graph_in_one() {
  toast_ok("Downloading all external picture references...");

  const section_ids = Object.keys(story.sections);

  download_media_in_section(0, section_ids, () => {
    toast_ok("All pictures embedded. Generting json for download...");

    var dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(story, null, 2));

    var dlAnchorElem = document.createElement("a");
    dlAnchorElem.style.display = "none";
    document.body.appendChild(dlAnchorElem);

    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "adventure_graph.json");
    dlAnchorElem.click();
  });
}

function download_graph_split() {
  toast_alert("Not yet implemented");
}

function load_file(content_handler, read_as_data) {
  var input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    const file = e.target.files[0];
    read_blob_and_handle(file, content_handler, read_as_data);
  };
  input.click();
}

function read_blob_and_handle(blob, content_handler, read_as_data) {
  const reader = new FileReader();
  if (read_as_data) {
    reader.readAsDataURL(blob);
  } else {
    reader.readAsText(file, "UTF-8");
  }
  reader.onload = (readerEvent) => {
    const content = readerEvent.target.result;
    //console.log(content);
    content_handler(content);
  };
}

function load_graph() {
  load_file((content) => {
    story = JSON.parse(content);
    redraw_adventure_graph();
  });
}

function add_or_remove_media() {
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
  redraw_adventure_graph();
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

function get_parent_section_of_active_element() {
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

  return { parent_section, sibbling_index };
}

function handle_global_key_down(event) {
  //console.debug("keydown", event);

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

  if (!active_element) {
    return;
  }

  const active_section = find_elements_section(active_element);
  if (!active_section) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.stopPropagation();
    if (!active_section?.next || active_section.next.length < 1) {
      return;
    }
    active_element = story.sections[active_section.next[0].next];
    text_editor_load(active_element);
    return;
  }

  if (!story?.sections) {
    return;
  }
  const { parent_section, sibbling_index } =
    get_parent_section_of_active_element();

  if (!parent_section) {
    return;
  }

  if (event.key === "ArrowUp") {
    event.stopPropagation();
    text_editor_load(parent_section);
    return;
  }

  if (event.key === "ArrowLeft") {
    event.stopPropagation();
    if (sibbling_index > 0) {
      text_editor_load(
        story.sections[parent_section.next[sibbling_index - 1].next]
      );
      return;
    }
    text_editor_load(
      story.sections[parent_section.next[parent_section.next.length - 1].next]
    );
    return;
  }
  if (event.key === "ArrowRight") {
    event.stopPropagation();
    if (sibbling_index < parent_section.next.length - 1) {
      text_editor_load(
        story.sections[parent_section.next[sibbling_index + 1].next]
      );
      return;
    }
    text_editor_load(story.sections[parent_section.next[0].next]);
    return;
  }
}

function add_action() {
  const active_section = find_elements_section(active_element);
  if (!active_section) {
    return;
  }

  if (!active_section?.script) {
    active_section.script = [];
  }

  active_section.script.push({
    action: "NONE",
    parameters: [],
  });
  console.debug("added action to section", active_section.id);
  text_editor_load(active_section);
}

text_area.addEventListener("change", handle_text_change);

text_area.addEventListener("paste", paste_image);

delete_button.addEventListener("click", handle_delete);
add_node_button.addEventListener("click", handle_add_node);
add_edge_button.addEventListener("click", handle_add_edge);
document
  .getElementById("download_in_one_button")
  .addEventListener("click", download_graph_in_one);
document
  .getElementById("download_split_button")
  .addEventListener("click", download_graph_split);
load_button.addEventListener("click", load_graph);
clear_all_button.addEventListener("click", clear_all);
add_media_button.addEventListener("click", add_or_remove_media);
document
  .getElementById("redraw_button")
  .addEventListener("click", redraw_adventure_graph);

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

function on_load() {
  redraw_adventure_graph();
  load_variables_menu();
}

load_example().then(on_load);
