import cytoscape from "./cytoscape.esm.min.js";

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
const add_media_button = document.getElementById("add_media_button");

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

  for (const section of adventure.sections) {
    cyto.add([{ group: "nodes", data: section }]);
    const new_node = cyto.getElementById(section.id);

    new_node.on("tap", function (evt) {
      text_label.innerText = "Story for Section " + section.id;
      text_editor_load(section);
    });

    console.log("node added", new_node);
  }

  for (const section of adventure.sections) {
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

        text_label.innerText =
          "Text to choose going from Section " +
          section.id +
          " to Section " +
          next.next;
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
}

function text_editor_load(element) {
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

function handle_text_change() {
  if (!active_element) {
    return;
  }
  if (active_element?.text_lines) {
    active_element.text_lines = text_area.value.split("\n");
  } else {
    active_element.text = text_area.value;
  }
}

function handle_delete() {
  if (!active_element) {
    return;
  }

  var deleted_section_id = null;
  if (story.sections.includes(active_element)) {
    story.sections.splice(story.sections.indexOf(active_element), 1);
    console.debug("deleted section", active_element);
    deleted_section_id = active_element.id;
  }

  for (const section of story.sections) {
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
  const next_id = Math.max(...story.sections.map((section) => section.id)) + 1;
  story.sections.push({
    id: next_id,
    text_lines: [""],
  });

  display_adventure_graph(story, cy);
}

function handle_add_edge() {
  if (!active_element || !story.sections.includes(active_element)) {
    alert("Please select the starting node, than click add edge.");
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
      if (!active_element || !story.sections.includes(active_element)) {
        alert("Please section to add media to.");
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

text_area.addEventListener("change", handle_text_change);
delete_button.addEventListener("click", handle_delete);
add_node_button.addEventListener("click", handle_add_node);
add_edge_button.addEventListener("click", handle_add_edge);
download_button.addEventListener("click", download_graph);
load_button.addEventListener("click", load_graph);
add_media_button.addEventListener("click", add__or_remove_media);

async function load_example() {
  const url = "example_story.json";
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
