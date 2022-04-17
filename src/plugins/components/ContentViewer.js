import CustomElement from "../../CustomElement";

CustomElement.register({
  is: "content-viewer",

  properties: ["content"],

  onInit: function () {
    console.log("-- onInit --");
  },

  onLinked: function () {
    // alert(`${this.is} - isLinked!`);
  },

  getTemplate: function () {
    return `<template>
            <div style="width: 500px; min-height:600px">
                <div>Fin du Magister d'Annie Ernaux au collège de France</div>
                <div>
                    <span><strong>Référence</strong></span>
                    <p>Double couche successive d'oubli</p>
                </div>
                <div>Fin du Magister d'Annie Ernaux au collège de France</div>
                <div>
                    <span><strong>Auteurs</strong></span>
                    <div>Fin du Magister d'Annie Ernaux au collège de France</div>
                </div>
            </div>
        </template>`;
  },
});
