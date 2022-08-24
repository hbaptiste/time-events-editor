import CustomElement from "../../CustomElement";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import "../../css/prose-mirror.css";

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.

CustomElement.register({
  is: "content-editor",
  properties: ["text"],
  data: {},

  onInit: () => {
    alert("radical");
  },

  onLinked: function () {
    const mySchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
      marks: schema.spec.marks,
    });

    let target = document.querySelector("#editor");
    const content = document.querySelector("#content");
    console.log(DOMParser.fromSchema(mySchema).parse(content));
    console.log("schema", schema);
    const plugins = exampleSetup({ schema });
    console.log("plugins->", plugins);
    this.view = new EditorView(target, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(mySchema).parse(content),
        plugins: exampleSetup({ schema: mySchema }),
      }),
    });
  },

  getTemplate: () => {
    return `<template>
                <div>
                    <div style="width:500px; height:300px" id="editor"></div>
                    <div id="content">You better know!</div>
                </div>
            </template>`;
  },
});
