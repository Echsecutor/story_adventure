import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Navigation bar component with File and Edit menus.
 */
import { Navbar as BootstrapNavbar, Nav, NavDropdown, Container } from 'react-bootstrap';
/**
 * Navigation bar with File and Edit menus.
 */
export function Navbar({ onNewStory, onLoadStory, onSaveStory, onSaveStoryWithImages, onGenerateBundle, onCreateLinearStory, onAddSection, onRedraw, onShowVariables, onShowJson, }) {
    return (_jsx(BootstrapNavbar, { bg: "light", expand: "lg", children: _jsxs(Container, { fluid: true, children: [_jsx(BootstrapNavbar.Brand, { children: "Story Adventure Editor" }), _jsx(BootstrapNavbar.Toggle, { "aria-controls": "basic-navbar-nav" }), _jsx(BootstrapNavbar.Collapse, { id: "basic-navbar-nav", children: _jsxs(Nav, { className: "me-auto", children: [_jsxs(NavDropdown, { title: "File", id: "file-menu", children: [_jsx(NavDropdown.Item, { onClick: onNewStory, children: "New Adventure" }), _jsx(NavDropdown.Item, { onClick: onLoadStory, children: "Load Adventure" }), _jsx(NavDropdown.Divider, {}), _jsx(NavDropdown.Item, { onClick: onSaveStory, children: "Save Adventure as it is" }), _jsx(NavDropdown.Item, { onClick: onSaveStoryWithImages, children: "Save Adventure with all images in one file" }), _jsx(NavDropdown.Item, { onClick: onGenerateBundle, children: "Generate playable adventure bundle" }), _jsx(NavDropdown.Item, { onClick: onCreateLinearStory, children: "Create Linear Story" }), _jsx(NavDropdown.Divider, {}), _jsx(NavDropdown.Item, { onClick: onShowJson, children: "Display Current Story JSON" })] }), _jsx(NavDropdown, { title: "Edit", id: "edit-menu", children: _jsx(NavDropdown.Item, { onClick: onAddSection, children: "Add Section" }) }), _jsx(NavDropdown, { title: "Story Variables", id: "variables-menu", children: _jsx(NavDropdown.Item, { onClick: onShowVariables, children: "Manage Variables" }) }), _jsx(Nav.Item, { children: _jsx(Nav.Link, { onClick: onRedraw, children: "Redraw Graph" }) })] }) })] }) }));
}
