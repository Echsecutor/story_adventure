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
