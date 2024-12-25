# Story Adventure Tools

This is a minimalist framework for writing / playing through (non-linear) stories.

If you like this, consider supporting further development!

<a href="https://www.buymeacoffee.com/Echsecutor" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## TL;DR

- 👉️ [Editor](https://echsecutor.github.io/story_adventure/editor)  👈️
- 👉️ [Viewer](https://echsecutor.github.io/story_adventure/viewer)  👈️


## Introduction

Have a look at the [example story](stories/example_story.json) to see the format.

A **Story Adventure** is primarily a set of **Sections** together with a **State** representing the current (initially the starting) state.
The **State** can also hold variables that you can set initially (e.g. for consistent naming of entities) or change during the game.

**Sections** links to each other via **Choices** in the `.next` array of each section. Sections without choices are terminal.
Sections can also contain **Media**, with a type (image/video) and the link to the src. This can also be embedded as a data link.
Embedding Media has the advantage of creating an all-in-one file, but the obvious disadvantage of creating large files with inefficient encoding of binary data.

**Choices** may contain a description which is then actually displayed as a choice when playing through the adventure.
If you leave the description empty, it is just a "next" type button to break long sections into readable chunks/change grafics. You likely do not want to do this if there is more then one choice.

## Editor

Using [the editor](./editor/) you can write your own story adventures by providing text and media for each section and linking the sections by choices.

- Files never leave your computer, the editor is pure JS running in your browser
- Try at: https://echsecutor.github.io/story_adventure/editor 

## Viewer

Using [the viewer](./viewer/) you can play thtough any story adventure.

- Files never leave your computer, the viewer is pure JS running in your browser
- Try at: https://echsecutor.github.io/story_adventure/viewer 


## Acknowledgment

We proudly acknowledge using the following open source components in this project:

- [Bootstrap 5](https://github.com/twbs/bootstrap) for UI components
- [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) for drawing the story graph in the editor
  -[cytoscape-klay](https://github.com/cytoscape/cytoscape.js-klay) for the graph layout
- [marked](https://github.com/markedjs/marked) for Markdown rendering in the viewer
- [DOMPurify](https://github.com/cure53/DOMPurify) for HTML sanitization in the viewer
- [JSZip](https://github.com/Stuk/jszip) for zipping (bundle export)
- [file-saver](https://github.com/eligrey/FileSaver.js/tree/master) for large files directly from the browsers memory
- [esm.sh](https://github.com/esm-dev/esm.sh) for converting the old JS packages among the above into esm modules

See there for the corresponding licenses and meta-dependencies.

## License

Copyright 2024 Sebastian Schmittner

<a href="https://www.gnu.org/licenses/agpl-3.0.html">
<img alt="AGPLV3" style="border-width:0" src="https://www.gnu.org/graphics/agplv3-with-text-162x68.png" /><br />
</a>

All code published in this repository is free software. Everything written by me, i.e. excluding the dependencies mentioned in the Acknowledgment, can be redistributed and/or modified under the terms of the
GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

For the included open source projects, different licenses might be applicable. See the respective projects pages listed above for details.
</a>
