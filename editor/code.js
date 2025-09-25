import cytoscapeKlay from "./cytoscape-klay.js";
import cytoscape from "./cytoscape.esm.min.js";
import saveAs from "./file-saver.js";
import JSZip from "./jszip.js";

cytoscape.use(cytoscapeKlay);

import { supported_actions } from "./common.js";
import { toast_alert, toast_ok } from "./toast.js";
import {
  create_element_with_classes_and_attributes,
  get_file_safe_title,
  get_text_from_section,
  load_file,
  read_blob_and_handle,
  tools_files,
} from "./utils.js";

import { get_story, save_story } from "./storage.js";

const data_url_regexp = /^data:image\/([a-z]*);base64,(.*)$/;

var story = {};
const current_editor_story_key = "current_editor_story";

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
const add_media_button = document.getElementById("add_media_button");
const section_select = document.getElementById("section_select");
const action_div = document.getElementById("action_div");
const media_src = document.getElementById("media_src");

const variables_menu = document.getElementById("variables_menu");

const hot_keys = {
  s: {
    description: "Add new Section",
    action: handle_add_node,
  },
  m: {
    description: "Load Picture",
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
      padding: 10,
      "border-width": 3,
      "border-opacity": 0.5,
      content: "data(id)",
      "text-valign": "center",
      "text-halign": "center",
    })
    .selector(".leave")
    .style({
      shape: "round-hexagon",
      "background-color": "red",
    })
    .selector(".root")
    .style({
      shape: "diamond",
      "background-color": "green",
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

  const active_section = find_elements_section(active_element);
  if (active_section) {
    const active_node = cy.getElementById(active_section.id);
    if (active_node) {
      new_node.position({
        x: active_node.position("x") + 100,
        y: active_node.position("y") + 20,
      });
    }
  }

  new_node.on("tap", function (evt) {
    text_editor_load(section);
  });

  console.log("node added", new_node);

  section_select.appendChild(
    create_element_with_classes_and_attributes("option", {
      attributes: { value: section.id },
      text: section.id,
    })
  );
}

function remove_edge(from, to) {
  try {
    const edge_id = from + "-" + to;
    cy.remove("#" + edge_id);
  } catch (e) {
    console.error("error removing edge", e);
  }
}

function add_edge(section, choice) {
  try {
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
  } catch (e) {
    console.error("error adding edge", e);
  }
}

function redraw_adventure_graph() {
  console.debug("drawing adventure graph", story);
  cy.remove("node");
  section_select.innerHTML = "";
  section_select.appendChild(
    create_element_with_classes_and_attributes("option", {
      attributes: { value: "new_section" },
      text: "New Section",
    })
  );

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

  const layouts = {
    breadthfirst: {
      name: "breadthfirst",
      directed: true,
      spacingFactor: 1.3,
      animate: true,
    },
    cose: {
      name: "cose",
      animate: true,
    },
    klay: {
      name: "klay",
      animate: true,
      klay: {
        aspectRatio: 10, // The aimed aspect ratio of the drawing, that is the quotient of width by height
        direction: "RIGHT", // Overall direction of edges: horizontal (right / left) or vertical (down / up)
        /* UNDEFINED, RIGHT, LEFT, DOWN, UP */
        thoroughness: 14, // How much effort should be spent to produce a nice layout..
      },
    },
  };

  const layout = cy.layout(layouts["klay"]);
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
  menu.appendChild(document.createElement("li")).appendChild(
    create_element_with_classes_and_attributes("a", {
      class_list: ["dropdown-item"],
      attributes: {
        href: "#",
      },
      event_listener: {
        click: on_click,
      },
      text: text,
    })
  );
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

function add_action_select_to(col, current_value, apply_new_action) {
  const select = col.appendChild(document.createElement("select"));
  select.classList.add("form-select");
  for (const supported_action of Object.keys(supported_actions)) {
    select.appendChild(
      create_element_with_classes_and_attributes("option", {
        class_list: ["form-select"],
        attributes: {
          value: supported_action,
        },
        text: supported_action,
      })
    );
  }
  select.value = current_value;
  select.onchange = () => {
    apply_new_action(select.options[select.selectedIndex].value);
    text_editor_load(active_element);
  };
}

function add_parameter(
  col,
  action,
  parameter_index,
  action_type,
  parameter_type_index,
  row
) {
  const parameter_type =
    supported_actions[action_type].parameters[parameter_type_index];
  switch (parameter_type) {
    case "STRING":
      const input = col.appendChild(document.createElement("input"));
      input.type = "text";
      input.classList.add("form-control");
      input.value = action.parameters[parameter_index];
      input.addEventListener("change", () => {
        action.parameters[parameter_index] = input.value;
        console.debug("changed action", action);
      });
      break;
    case "VARIABLE":
      const selectVariable = col.appendChild(document.createElement("select"));
      selectVariable.classList.add("form-select");
      if (!story?.state?.variables) {
        return;
      }
      for (const variable of Object.keys(story.state.variables)) {
        const option = selectVariable.appendChild(
          document.createElement("option")
        );
        selectVariable.classList.add("form-select");
        option.text = variable;
        option.value = variable;
      }
      selectVariable.value = action.parameters[parameter_index];
      selectVariable.onchange = () => {
        action.parameters[parameter_index] =
          selectVariable.options[selectVariable.selectedIndex].value;
      };
      break;
    case "SECTION":
      const selectSection = col.appendChild(document.createElement("select"));
      selectSection.classList.add("form-select");
      for (const section_key of Object.keys(story.sections)) {
        const option = selectSection.appendChild(
          document.createElement("option")
        );
        selectSection.classList.add("form-select");
        option.text = story.sections[section_key].id;
        option.value = story.sections[section_key].id;
      }
      selectSection.value = action.parameters[parameter_index];
      selectSection.onchange = () => {
        action.parameters[parameter_index] =
          selectSection.options[selectSection.selectedIndex].value;
      };
      break;
    case "ACTION":
      col.remove();
      add_action_and_parameter_inputs_to_row(
        row,
        action,
        (new_action) => {
          action.parameters[parameter_index] = new_action;
          action.parameters.splice(parameter_index + 1);
          for (const parameter_type of supported_actions[new_action]
            .parameters) {
            action.parameters.push("");
          }
        },
        action.parameters[parameter_index],
        parameter_index + 1
      );
      break;
    case "ENUM":
      const selectEnum = col.appendChild(document.createElement("select"));
      selectEnum.classList.add("form-select");
      const enum_options = supported_actions[action_type]?.enum;
      if (!enum_options) {
        console.error("Action does not specify enum values", action);
        break;
      }
      for (const enumValue of enum_options) {
        const option = selectEnum.appendChild(document.createElement("option"));
        option.text = enumValue;
        option.value = enumValue;
      }
      selectEnum.value = action.parameters[parameter_index];
      selectEnum.onchange = () => {
        action.parameters[parameter_index] =
          selectEnum.options[selectEnum.selectedIndex].value;
      };
      break;
    default:
      console.error("Unsupported parameter type:", parameter_type);
  }
}

function add_action_and_parameter_inputs_to_row(
  row,
  action,
  apply_new_action,
  action_type,
  start_in_current_action_params
) {
  const first_col = row.appendChild(document.createElement("div"));
  first_col.classList.add("col");
  add_action_select_to(first_col, action_type, apply_new_action);

  if (!supported_actions[action_type]) {
    return;
  }
  for (let i = 0; i < supported_actions[action_type].parameters.length; i++) {
    const para_col = row.appendChild(document.createElement("div"));
    para_col.classList.add("col");
    add_parameter(
      para_col,
      action,
      start_in_current_action_params + i,
      action_type,
      i,
      row
    );
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
    add_action_and_parameter_inputs_to_row(
      row,
      action,
      (new_action) => {
        action.action = new_action;
        action.parameters = [];
        for (const parameter_type of supported_actions[action.action]
          .parameters) {
          action.parameters.push("");
        }
      },
      action.action,
      0
    );
  }
}

function text_editor_load(element) {
  if (!element) {
    element = active_element;
  }
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

  if (element.next && !Array.isArray(element.next)) {
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
  media_src.value = "";
  if (element?.media?.src) {
    media_src.value = element?.media?.src;
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
    add_media_button.innerHTML = "Load Picture";
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

  const parent_section = find_elements_section(active_element);
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

  if (deleted_section_id) {
    cy.remove("#" + deleted_section_id);
  } else {
    remove_edge(parent_section?.id, active_element?.next);
  }

  //redraw_adventure_graph();
}

function handle_add_node() {
  if (!story) {
    story = {};
  }
  let next_id = 1;
  if (!story.sections) {
    story.sections = {};
  } else {
    next_id =
      Math.max(
        0,
        ...Object.keys(story.sections)
          .map((key) => parseInt(key))
          .filter(Number.isInteger)
      ) + 1;
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

async function download_media_in_section(
  current_index,
  section_ids,
  final_callback
) {
  console.debug("current_index", current_index);
  if (current_index >= section_ids.length) {
    final_callback();
    return;
  }

  const section = story.sections[section_ids[current_index]];
  if (section?.media?.src && !section.media.src.startsWith?.("data")) {
    console.debug(`Embedding ${section.media.src}`);
    return fetch(section.media.src)
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
              final_callback
            );
          },
          true
        );
      });
  } else {
    return download_media_in_section(
      current_index + 1,
      section_ids,
      final_callback
    );
  }
}

async function download_as_is() {
  toast_ok("Generating JSON for download...");

  var blob = new Blob([JSON.stringify(story, null, 2)], {
    type: "text/json;charset=utf-8",
  });
  return save_file(blob, get_file_safe_title(story) + ".json");
}

async function download_graph_in_one() {
  toast_ok("Downloading all external picture references...");

  const section_ids = Object.keys(story.sections);

  download_media_in_section(0, section_ids, () => {
    toast_ok("All pictures embedded. Generating json for download...");
    download_as_is();
  });
}

async function download_graph_split() {
  toast_ok("Extracting images into separate files");
  const story_deep_copy = JSON.parse(JSON.stringify(story));
  var zip = new JSZip();
  var folder = zip.folder("stories").folder(get_file_safe_title(story));

  const wait_for_all = [];
  for (const section_id in story.sections) {
    const section = story.sections[section_id];
    if (!section?.media?.src) {
      continue;
    }
    const match = section.media.src.match(data_url_regexp);
    if (match) {
      const type = match[1];
      const data = match[2];
      console.log("Adding image for section", section, "to zip");
      const file_name = section_id + "." + type;
      story_deep_copy.sections[section.id].media.src =
        "../stories/" + get_file_safe_title(story) + "/" + file_name;
      folder.file(file_name, data, { base64: true });
    } else {
      console.debug(
        "section media src did not match data url regexp. Try fetching.",
        section
      );
      const typeMatch = section.media.src.match(".*\\.([a-zA-Z]*)$");
      var type = "jpg";
      if (typeMatch) {
        type = typeMatch[1];
      } else {
        console.warn("Could not determine file type of", section.media.src);
      }
      const file_name = section_id + "." + type;
      story_deep_copy.sections[section.id].media.src =
        "../stories/" + get_file_safe_title(story) + "/" + file_name;
      wait_for_all.push(
        fetch(section.media.src)
          .then((response) => response.blob())
          .then((blob) => {
            folder.file(file_name, blob);
            console.debug("Saved", file_name);
          })
      );
    }
  }

  if (wait_for_all) {
    await Promise.all(wait_for_all);
  }
  console.log("All pics saved");

  toast_ok("Saving Story");

  folder.file(
    get_file_safe_title(story) + ".json",
    JSON.stringify(story_deep_copy)
  );

  add_stroy_adventure_files(zip)
    .then(() => {
      const percentage = create_element_with_classes_and_attributes("p");
      toast_ok("Generating Zip", "false", percentage);
      zip
        .generateAsync({ type: "blob" }, function updateCallback(metadata) {
          percentage.innerHTML = metadata.percent.toFixed(2) + " %";
        })
        .then(function (content) {
          return save_file(content, get_file_safe_title(story) + ".zip");
        });
    })
    .catch((err) => {
      console.error("Error generating story adventure zip", err);
      toast_alert("Error generating bundle.");
    });
}

async function save_file(blob, file_name) {
  return saveAs(blob, file_name);
}

async function add_to_zip(zip, folder, global_path = "../") {
  const wait_for_all = [];

  if (folder?.files) {
    for (const file_name of folder.files) {
      wait_for_all.push(
        fetch(global_path + file_name)
          .then((response) => response.blob())
          .then((blob) => {
            zip.file(file_name, blob);
          })
      );
    }
  }
  if (folder?.folders) {
    for (const sub_folder in folder.folders) {
      const zip_sub_folder = zip.folder(sub_folder);
      wait_for_all.push(
        add_to_zip(
          zip_sub_folder,
          folder.folders[sub_folder],
          global_path + sub_folder + "/"
        )
      );
    }
  }

  return Promise.all(wait_for_all);
}

async function add_stroy_adventure_files(zip) {
  toast_ok("Adding tools to archive");
  return add_to_zip(zip, tools_files).then(() => {
    const story_name = get_file_safe_title(story);
    zip.file(
      "index.html",
      `<!DOCTYPE html>
<html>
  <head>
    <title>Loading Adventure...</title>
  </head>

  <body>
    <script>
        window.location.href="./viewer/?load=../stories/${story_name}/${story_name}.json";
    </script>
  </body>
</html>
    `
    );
  });
}

function load_graph() {
  load_file((content) => {
    try {
      story = JSON.parse(content);
      redraw_adventure_graph();
      load_variables_menu();
    } catch (error) {
      toast_alert("Error loading graph: " + error.message);
    }
  });
}

function add_or_remove_media() {
  if (active_element?.media?.type) {
    active_element.media = {};
    text_editor_load(active_element);
  } else {
    if (!active_element || !story?.sections?.[active_element.id]) {
      alert("Please select section to add media to.");
      return;
    }
    load_file((content) => {
      active_element.media = {
        type: "image",
        src: content,
      };
      text_editor_load(active_element);
    }, true);
  }
}

function new_story() {
  story = {
    sections: {
      1: {
        text_lines: [""],
        id: 1,
      },
    },
  };
  text_editor_load(story.sections["1"]);
  redraw_adventure_graph();
  load_variables_menu();
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

  if (event.key === "ArrowRight") {
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

  if (event.key === "ArrowLeft") {
    event.stopPropagation();
    text_editor_load(parent_section);
    return;
  }

  if (event.key === "ArrowUp") {
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
  if (event.key === "ArrowDown") {
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

async function load_last_story_or_example() {
  try {
    story = await get_story(current_editor_story_key);
    if (story) {
      return;
    }
  } catch (err) {
    console.error("Error loading story from local storage", err);
  }

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

async function create_linear_story() {
  const start_at = prompt("Start at section:", "1");
  if (!start_at) {
    return;
  }
  const end_at = prompt("Finish at section:");
  if (!end_at) {
    return;
  }
  const passing_through = [];
  var passing = prompt(
    "Add section to pass through list (leave empty to finish):"
  );
  while (passing) {
    passing_through.push(passing);
    passing = prompt(
      "Add section to pass through list (leave empty to finish):"
    );
  }
  toast_ok("Generating linear story...");
  console.debug(
    "Creating linearized story from",
    start_at,
    "to",
    end_at,
    "passing_through",
    passing_through
  );
  depth_first_search([start_at], end_at, passing_through)
    .then((linearized_history) => {
      console.debug("linearized_history", linearized_history);
      if (!linearized_history) {
        toast_alert(
          "I could not find a linear story which starts at " +
            start_at +
            " and ends at " +
            end_at +
            " while passing through all of " +
            passing_through
        );
        return;
      }

      toast_ok("Found a linear story. Generating Markdown...");

      return markdown_from_section_id_list(linearized_history);
    })
    .then((markdown) => {
      if (!markdown) {
        return;
      }
      var blob = new Blob([markdown], { type: "text/plain;charset=utf-8" });
      save_file(blob, get_file_safe_title(story) + ".md");
    })
    .catch((error) => {
      console.error(error);
      toast_alert("Error generating linearized story");
    });
}

async function markdown_from_section_id_list(section_ids) {
  let md = "";
  for (const id of section_ids) {
    console.debug("adding section to markdown", id);
    md += get_text_from_section(story.sections?.[id], story?.state?.variables);
    md += "\n\n";
    if (story.sections?.[id]?.media?.src) {
      md += "![](" + story.sections?.[id]?.media?.src + ")\n\n";
    }
  }
  return md;
}

async function depth_first_search(linearized_history, end_at, passing_through) {
  if (linearized_history[linearized_history.length - 1] == end_at) {
    console.debug("dfs reached target", end_at);
    if (passing_through) {
      for (const passing of passing_through) {
        if (
          !linearized_history.includes(String(passing)) &&
          !linearized_history.includes(Number(passing))
        ) {
          console.debug(linearized_history, "not passing through", passing);
          return null;
        }
      }
    }
    console.debug(
      linearized_history,
      "is passing through all of",
      passing_through
    );
    return linearized_history;
  }
  const current_section_id = linearized_history[linearized_history.length - 1];
  const current_section = story.sections[current_section_id];
  if (!current_section) {
    toast_alert("No section " + current_section_id);
    return null;
  }
  if (!current_section.next) {
    console.debug("Dead end", current_section_id);
    return null;
  }
  for (const next of current_section.next) {
    if (linearized_history.includes(next.next)) {
      console.log("cycle detected. not following", next);
      continue;
    }
    const found_path = await depth_first_search(
      [...linearized_history, next.next],
      end_at,
      passing_through
    );
    if (found_path) {
      return found_path;
    }
  }
  console.debug("No continuation possible for", linearized_history);
  return null;
}

var error_in_autosave_reported = false;
async function local_save() {
  try {
    console.debug("local save");
    await save_story(current_editor_story_key, story);
    if (error_in_autosave_reported) {
      toast_ok("Autosaving is working.");
    }
    error_in_autosave_reported = false;
  } catch (err) {
    console.error("Error in autosave", err);
    if (!error_in_autosave_reported) {
      toast_alert("Error auto-saving the story.");
    }
    error_in_autosave_reported = true;
  }
}

function set_save_interval() {
  window.setInterval(local_save, 30000);
}

function on_load() {
  redraw_adventure_graph();
  load_variables_menu();
}

async function init() {
  add_listeners();
  load_last_story_or_example().then(on_load);
  set_save_interval();
}

function handle_media_src_change(event) {
  if (!active_element) {
    console.error("No active element to update media source.");
    return;
  }

  const newSrc = media_src.value.trim();
  if (!newSrc) {
    console.warn("Empty media source provided.");
    return;
  }

  active_element.media = {
    type: "image",
    src: newSrc,
  };
  console.debug("Media source updated for active element:", active_element);
  text_editor_load(active_element);
}

function add_listeners() {
  text_area.addEventListener("change", handle_text_change);
  text_area.addEventListener("paste", paste_image);
  media_src.addEventListener("change", handle_media_src_change);

  delete_button.addEventListener("click", handle_delete);
  add_node_button.addEventListener("click", handle_add_node);
  add_edge_button.addEventListener("click", handle_add_edge);

  document
    .getElementById("download_as_is_button")
    .addEventListener("click", download_as_is);
  document
    .getElementById("download_in_one_button")
    .addEventListener("click", download_graph_in_one);
  document
    .getElementById("download_split_button")
    .addEventListener("click", download_graph_split);
  load_button.addEventListener("click", load_graph);
  document
    .getElementById("clear_all_button")
    .addEventListener("click", new_story);
  add_media_button.addEventListener("click", add_or_remove_media);
  document
    .getElementById("redraw_button")
    .addEventListener("click", redraw_adventure_graph);

  document
    .getElementById("linearize_button")
    .addEventListener("click", create_linear_story);

  document.addEventListener("keydown", handle_global_key_down);

  document
    .getElementById("story_modal")
    .addEventListener("shown.bs.modal", () => {
      document.getElementById("story_code").innerHTML = JSON.stringify(
        story,
        null,
        2
      );
    });
}

init();
