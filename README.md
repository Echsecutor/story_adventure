# Story Adventure Tools

This is a minimalist framework for writing / playing through (non-linear) stories.

## Introduction

Let's introduce the basic idea by example: have a look at the [example story](editor/example_story.json).

A **Story Adventure** is primarily a set of **Sections** together with a **State** representing the current (initially the starting) state.
**Sections** links to each other via **Choices** in the `.next` array of each section. Sections without choices are terminal.

## Editor

Try online at: https://echsecutor.github.io/story_adventure/editor
- Files never leave your computer, the editor is pure JS running in your browser

Using [the editor](./editor/) you can write your own story adventures by providing text and media for each section and linking the sections by choices.


## Acknowledgment

We proudly acknowledge using the following open source components in this project:

- [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) for drawing the graph view of the story
- [Bootstrap 5](https://github.com/twbs/bootstrap) for UI components
- [marked](https://github.com/markedjs/marked) for Markdown rendering
- [DOMPurify](https://github.com/cure53/DOMPurify) for HTML sanitization

See there for the corresponding licenses.

## License

Copyright 2024 Sebastian Schmittner

<a href="https://www.gnu.org/licenses/agpl-3.0.html">
<img alt="AGPLV3" style="border-width:0" src="https://www.gnu.org/graphics/agplv3-with-text-162x68.png" /><br />
</a>

All code published in this repository is free software: you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

For the included open source projects, different licenses might be applicable. See the respective projects pages listed above for details.
</a>
