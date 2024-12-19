export function toast_alert(text, auto_hide = true) {
  toast(
    text,
    auto_hide,
    "bg-danger",
    ...Array.prototype.slice.call(arguments, 2)
  );
}

export function toast_ok(text, auto_hide = true) {
  toast(
    text,
    auto_hide,
    "bg-success",
    ...Array.prototype.slice.call(arguments, 2)
  );
}

// permits any number of further arguments which are elements to be appended to the toast body after the text node
function toast(text, auto_hide, bg_class) {
  console.debug("toast arguments=", arguments);
  const toast = document.createElement("div");
  toast.setAttribute("data-bs-autohide", auto_hide);
  toast.setAttribute("aria-atomic", "true");
  toast.setAttribute("aria-live", "polite");

  toast.className =
    "toast align-items-center text-white border-0 d-flex p-3 " + bg_class;
  toast.role = "alert";

  const toast_body = toast.appendChild(document.createElement("div"));
  toast_body.className = "toast-body";
  toast_body
    .appendChild(document.createElement("p"))
    .appendChild(document.createElement("strong"))
    .appendChild(document.createTextNode(text));

  for (var i = 3; i < arguments.length; i++) {
    console.debug("Appending", arguments[i]);
    toast_body.appendChild(arguments[i]);
  }

  const close_button = toast.appendChild(document.createElement("button"));
  close_button.type = "button";
  close_button.className = "btn-close btn-close-white me-2 m-auto";
  close_button.dataset.bsDismiss = "toast";

  let class_container = document.getElementsByClassName("toast-container")[0];
  if (!class_container) {
    class_container = document.body.appendChild(document.createElement("div"));
    class_container.classList.add("toast-container");

  }

  class_container.appendChild(toast);

  toast.addEventListener('hidden.bs.toast', function () {
    toast.remove();
  })

  const bootstrap_toast = new bootstrap.Toast(toast);
  bootstrap_toast.show();
}
