export function create_element_with_classes_and_attributes(
  element_name,
  class_list,
  attributes,
  event_listener
) {
  var element = document.createElement(element_name);
  if (class_list) {
    for (const element_class of class_list) {
      element.classList.add(element_class);
    }
  }
  if (attributes) {
    for (const attribute in attributes) {
      element.setAttribute(attribute, attributes[attribute]);
    }
  }
  if (event_listener) {
    for (const event_type in event_listener) {
      element.addEventListener(event_type, event_listener[event_type]);
    }
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

  export function get_text_from_section(section, variables){
    let text = "";
    if (section?.text_lines) {
      text = section.text_lines.join("\n");
    } else if (section?.text) {
      text = section.text;
    }
    return replace_variables(text, variables);
  }