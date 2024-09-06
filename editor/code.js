import cytoscape from "./cytoscape.esm.min.js";

var story = {
  state: {
    current_section: "1",
    variables: {
      hunted_by: "a huge dragon",
    },
  },
  sections: [
    {
      id: "1",
      text_lines: [
        "# The Beginning",
        "",
        "This is the beginning of your Adventure!",
        "",
        "You woke up by the side of a path running through a forest.",
        "The weather is quite nice and pretty warm already, although it is still early morning.",
        "You can not remember where you are exactly or why you slept by the side of the path with all your clothes on, but judging from your headache this might be related to drinking a little ",
        "to much yesterday...? Anyway, you probably want to start moving and at least find yourself some water to fight the fire that seems to be roaring in your throat....",
        "The path is roughly oriented in a east-west direction. Since you have no clue which way you came, do you want to...",
        "",
      ],
      next: [
        {
          text: "turn east! Towards the rising sun!",
          next: "2",
        },
        {
          text: "turn west! Your head was pointing in this direction when you woke up, so you where probably walking in this direction. Maybe.",
          next: "3",
        },
      ],
    },
    {
      id: "2",
      text_lines: [
        "Collecting yourself from the ground you start walking east, the pockets of your jacket and trousers for clues where you came from or what happened.",
        "",
        "Just as your fingers touch the first thing that might be interesting, you freeze in mid step as the path takes a slight turn and you suddenly find yourself face to face with",
        "${hunted_by}.",
        "",
        "It seems like the beast was hunting you. A memory of running through these woods flashes past you. Right. You where lying by the road because you stumbled when running away from this ",
        "beast. You try to pick up where you left, turn around an pick that running back up, but way to late. The dragon is much quicker to recover from the surprise of seeing you and catches up to you with a huge jump, just to bite your head off.",
      ],
    },
    {
      id: "3",
      text_lines: [
        "Collecting yourself from the ground you start walking east, the pockets of your jacket and trousers for clues where you came from or what happened.",
        "As your fingers touch a smooth and cold object, a feeling of unease overcomes you. Maybe you did not just walk this forest drunk...",
        "it feels more like you where running away from something...",
        "You touch your aching head to find a huge bump right at your forehead.",
        "Maybe you stumbled and fell and injured your head in the process...",
        "Might explain another few bruises and scratches that you start noticing on your body.",
      ],
      next: [
        {
          text: "Maybe it would be a good idea to hide in the rather thick bushes by the side of the path?",
          next: "4",
        },
        {
          text: "It feels like you might want to pick up the pace. What ever you where running away from might still be after you!",
          next: "5",
        },
      ],
    },
    {
      id: "4",
      text_file: {
        path: "path/to/hiding.md",
        type: "text/markdown",
      },
    },
    {
      id: "5",
      text_lines: ["You win!"],
    },
  ],
};

const text_area = document.getElementById("text");
const text_label = document.getElementById("text_label");
const text_container = document.getElementById("text_editor_card");
const delete_button = document.getElementById("delete_button");
const add_node_button = document.getElementById("add_node_button");
const add_edge_button = document.getElementById("add_edge_button");

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
  text_container.style.display = "block";
  text_area.value = "";
  active_element = element;
  if (element?.text_lines) {
    text_area.value = element.text_lines.join("\n");
  }
  if (element?.text) {
    text_area.value = element.text;
  }
}

function text_editor_hide() {
  text_container.style.display = "none";
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

text_area.addEventListener("change", handle_text_change);
delete_button.addEventListener("click", handle_delete);
add_node_button.addEventListener("click", handle_add_node);
add_edge_button.addEventListener("click", handle_add_edge);

display_adventure_graph(story, cy);
