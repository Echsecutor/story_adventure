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
  return element;
}

export function replace_variables(text, variables) {
  if (!variables || !text) {
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

export const viewer_files = [
  "bootstrap.bundle.min.js",
  "bootstrap-icons-font",
  "bootstrap.min.css",
  "code.js",
  "common.js",
  "favicon.ico",
  "favicon.png",
  "index.html",
  "marked.esm.js",
  "purify.es.mjs",
  "README.md",
  "style.css",
  "toast.js",
  "utils.js",
];

export const editor_files = [
  "base64-js.mjs",
  "bootstrap.min.css",
  "code.js",
  "cytoscape.esm.min.js",
  "cytoscape-klay.mjs",
  "favicon.png",
  "index.html",
  "jszip.mjs",
  "node_events.js",
  "README.md",
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
];
