// time-events-editor.spec.js created with Cypress
//
// Start writing your Cypress tests below!
// If you're unfamiliar with how Cypress works,
// check out the link below and learn how to write your first test:
// https://on.cypress.io/writing-first-test

describe("Testing cypress", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080");
  });

  it("Should display a video element", () => {
    cy.get("#mainvideo_html5_api").should("have.length", 1);
  });

  it("Should create events", () => {
    cy.createEvent({ name: "test", tag: 3, start: "00:01:00", end: "00:05:00", detail: "This is my detail" });
  });
});
