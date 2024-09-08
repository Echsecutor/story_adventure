export function toast_alert(text) {
  toast(text, "bg-danger");
}

export function toast_ok(text) {
  toast(text, "bg-success");
}

function toast(text, bg_class) {
  const toast = document.createElement("div");
  toast.className =
    "toast align-items-center text-white border-0 d-flex m-2 " + bg_class;
  toast.role = "alert";

  const toast_body = toast.appendChild(document.createElement("div"));
  toast_body.className = "toast-body";
  toast_body.appendChild(
    document.createElement("strong").appendChild(document.createTextNode(text))
  );

  /*
  const toast_header = toast.appendChild(document.createElement("div"));
  toast_header.className = "toast-header";
  toast_header.appendChild(
    document
      .createElement("strong")
      .appendChild(document.createTextNode(header))
  );
  */
  const close_button = toast.appendChild(document.createElement("button"));
  close_button.type = "button";
  close_button.className = "btn-close btn-close-white me-2 m-auto";
  close_button.dataset.bsDismiss = "toast";

  document.body.appendChild(toast);

  const bootstrap_toast = new bootstrap.Toast(toast);
  bootstrap_toast.show();
}
