import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Help modal component displaying hotkey information.
 */
import { Modal, Table } from 'react-bootstrap';
export function HelpModal({ show, onHide, hotkeys }) {
    return (_jsxs(Modal, { show: show, onHide: onHide, size: "xl", id: "help_modal", tabIndex: -1, "aria-labelledby": "help_modal_label", children: [_jsx(Modal.Header, { closeButton: true, children: _jsx(Modal.Title, { id: "help_modal_label", children: "Help" }) }), _jsxs(Modal.Body, { children: [_jsx("p", { children: "Use the following hotkeys anywhere in the viewer:" }), _jsxs(Table, { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col", children: "Key" }), _jsx("th", { scope: "col", children: "Description" })] }) }), _jsx("tbody", { children: Object.entries(hotkeys).map(([key, def]) => {
                                    const keys = [key, ...(def.aliases || [])];
                                    return (_jsxs("tr", { children: [_jsx("td", { children: _jsx("strong", { children: keys.join(', ') }) }), _jsx("td", { children: def.description })] }, key));
                                }) })] })] })] }));
}
