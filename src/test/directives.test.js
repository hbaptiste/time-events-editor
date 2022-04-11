/* eslint-disable no-undef */
// Load all directives
import "../Common.Binding";
import CustomElement from "../CustomElement";
import "../plugins/components/EventsRow";
import "../plugins/components/EventItem";

import html from "html";

import { renderSection } from "../TemplateHelpers";
import { htmlToElement } from "../Utils";

const nodeWithChildren = htmlToElement(`<div km:foreach="event in cleanEvents" class="event-row-wrapper" data-template-key="item_778">
                                          <p class="row event-title">{$key}</p>
                                          <events-row $eventsrow="event" class="event-row"></events-row>
                                        </div>`);

const simpleNode = htmlToElement(`<div km:foreach="event in cleanEvents" class="event-row-wrapper" data-template-key="item_778">
                                      <p data-testid="title" class="row event-title">{$key}:{event.name}</p>
                                  </div>`);

const createComponent = () => {
  return CustomElement.create({
    is: "fake",
    data: {},
    target: document.createElement("div"),
    properties: ["test"],
    getTemplate: () => `<template><div></div></template>`,
  }).$binding;
};

describe("Testing RenderSection", () => {
  test("Foreach Directives", () => {
    const ctxData = { localName: "event", parentName: "cleanEvents" };
    const ctx = createComponent();
    ctx.target.getTemplateData = jest
      .fn(() => {
        return {
          cleanEvents: [{ name: "Blaze 1" }, { name: "Blaze 2" }, { name: "Blaze 3" }],
        };
      })
      .mockName("getTemplateData");
    const domResult = renderSection({ ctx, node: simpleNode, data: ctxData });
    document.body.appendChild(domResult);

    expect(ctx.target.getTemplateData).toHaveBeenCalled();
    const divs = document.querySelectorAll(".event-row-wrapper");
    expect(divs.length).toBe(3);
    expect(divs[0].firstChild.tagName).toBe("P");
    expect(divs[0].childElementCount).toBe(1);
    expect(divs[0].firstElementChild).toHaveTextContent(/Blaze/i);
    expect(divs[2].firstElementChild).toHaveTextContent(/Blaze 3/i);

    /* test content */
  });
});

describe(" renderSection with sub section", () => {
  test("With Sub Section", () => {
    const ctxData = { localName: "event", parentName: "cleanEvents" };
    const ctx = createComponent();
    ctx.target.getTemplateData = jest
      .fn(() => {
        return {
          cleanEvents: {
            Livres: [
              { type: "livres", duration: [10, 20] },
              { type: "livres", duration: [1, 2] },
            ],
            Authors: [
              { type: "Authors", duration: [20, 30] },
              { type: "Authors", duration: [11, 12] },
            ],
            Bescherelles: [
              { type: "Bescherelles", duration: [40, 50] },
              { type: "Bescherelles", duration: [13, 20] },
            ],
          },
        };
      })
      .mockName("getTemplateData");
    const domResult = renderSection({ ctx, node: nodeWithChildren, data: ctxData });
    document.body.innerHTML = "";
    document.body.appendChild(domResult);
    console.log("-- INNER | HTML --");
    console.log(html.prettyPrint(document.body.innerHTML));
  });
});
