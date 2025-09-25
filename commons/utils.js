export function create_element_with_classes_and_attributes(
  element_name,
  properties
) {
  var element = document.createElement(element_name);
  if (properties?.class_list) {
    for (const element_class of properties.class_list) {
      element.classList.add(element_class);
    }
  }
  if (properties?.attributes) {
    for (const attribute in properties.attributes) {
      element.setAttribute(attribute, properties.attributes[attribute]);
    }
  }
  if (properties?.event_listener) {
    for (const event_type in properties.event_listener) {
      element.addEventListener(
        event_type,
        properties.event_listener[event_type]
      );
    }
  }
  if (properties?.innerHTML) {
    element.innerHTML = properties.innerHTML;
  }
  if (properties?.text) {
    element.text = properties.text;
  }

  for (var i = 2; i < arguments.length; i++) {
    console.debug("Appending", arguments[i]);
    element.appendChild(arguments[i]);
  }

  return element;
}

export function replace_variables(text, variables) {
  if (!variables || !text) {
    console.debug("Not replacing variables", text, variables);
    return text;
  }
  var re = text;
  for (const key in variables) {
    re = re.replaceAll("${" + key + "}", variables[key]);
  }
  return re;
}

export function get_text_from_section(section, variables) {
  let text = "";
  if (section?.text_lines) {
    text = section.text_lines.join("\n");
  } else if (section?.text) {
    text = section.text;
  }
  return replace_variables(text, variables);
}

export const tools_files = {
  files: ["LICENSE"],
  folders: {
    editor: {
      files: [
        "base64-js.mjs",
        "bootstrap.min.css",
        "code.js",
        "cytoscape.esm.min.js",
        "cytoscape-klay.mjs",
        "favicon.png",
        "file-saver.js",
        "file-saver.mjs",
        "index.html",
        "jszip.mjs",
        "node_events.js",
        "README.md",
        "storage.js",
        "toast.js",
        "bootstrap.bundle.min.js",
        "buffer.mjs",
        "common.js",
        "cytoscape-klay.js",
        "favicon.ico",
        "ieee754.mjs",
        "jszip.js",
        "klayjs.mjs",
        "node_process.js",
        "style.css",
        "utils.js",
      ],
    },
    viewer: {
      folders: {
        "bootstrap-icons-font": {
          folders: {
            fonts: {
              files: ["bootstrap-icons.woff", "bootstrap-icons.woff2"],
            },
          },
          files: [
            "bootstrap-icons.css",
            "bootstrap-icons.json",
            "bootstrap-icons.min.css",
            "bootstrap-icons.scss",
          ],
        },
      },
      files: [
        "bootstrap.bundle.min.js",
        "bootstrap.min.css",
        "code.js",
        "common.js",
        "favicon.ico",
        "favicon.png",
        "file-saver.js",
        "file-saver.mjs",
        "index.html",
        "marked.esm.js",
        "purify.es.mjs",
        "README.md",
        "style.css",
        "toast.js",
        "utils.js",
      ],
    },
  },
};

export function get_file_safe_title(story) {
  if (!story?.meta?.title) {
    return "story_adventure";
  }
  return story.meta.title.replaceAll(/[^a-z0-9-_]/gi, "_");
}

export function load_file(content_handler, read_as_data) {
  var input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    const file = e.target.files[0];
    read_blob_and_handle(file, content_handler, read_as_data);
  };
  input.click();
}

export function read_blob_and_handle(blob, content_handler, read_as_data) {
  const reader = new FileReader();
  if (read_as_data) {
    reader.readAsDataURL(blob);
  } else {
    reader.readAsText(blob, "UTF-8");
  }
  reader.onload = (readerEvent) => {
    const content = readerEvent.target.result;
    //console.log(content);
    content_handler(content);
  };
}
