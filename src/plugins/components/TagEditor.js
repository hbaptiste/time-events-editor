import CustomElement from "../../CustomElement";

CustomElement.register({
    
    is: 'tag-editor',

    properties: ["items", "title", "onChange"],

    data: {
        displayRowForm: true,
        selectedTag: null,
        rowTags: ["Respect", "Joie", "Indeed"],
        newItem: null,
    },
    
    onInit: function() {
        //this.registerSideEffects(this.handleItemSelection, ["selectedTag"]); // simplifier la notation
        return;
    },

    handleItemSelection: function(tag) { 
        if (tag == null) { return }
        //this.onChange(tag);
    },

    onLinked: function() {
       // alert(`${this.is} - isLinked!`);
    },

    _isSelected: function(index, value) {
        alert("--is selected --");
    },

    events: {
        showRowForm: function(e) {
            this.data.displayRowForm = false; //update({rowTags:})
        },

        createNewRow: function(e) {
            this.data.rowTags = [...this.data.rowTags, this.data.newItem];
            this.data.displayRowForm = true;
            this.data.selectedTag = this.data.newItem;
        }
    },
    
    getTemplate: function() {
        return `<template>
                    <div>
                        <span>{title}</span>
                        <div @showIf="displayRowForm">
                            <select @ref="select" @model="selectedTag">
                                <option km:foreach="item in rowTags">Patrov {item} options!</option>
                            </select>
                            <span class="addRowCls" @click="showRowForm">[+]</span>
                        </div>
                        <div class="row-edition">
                            <div @showIf="!displayRowForm">
                                <span km:model="newItem" contenteditable style="display: inline-block; width: 100px; border: 1px solid gray" class=""></span>
                                <span class="addRowCls" @click="createNewRow">[Add]</span>
                            </div>
                        </div>
                    </div>
                </template>`;
    }
});



                        