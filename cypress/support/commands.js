// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
console.log("cci");
Cypress.Commands.add("createEvent", (events) => {
  const evtData = Array.isArray(events) ? events : [events];

  cy.get(".newEventBtn").click();
  evtData.forEach(({ tag, name, start, end, detail }) => {
    // Create tag if not exists ... after
    cy.get("[role=tag-selector").select(1);
    cy.get("[role=event-name").type(name);
    cy.get("[role=event-start").type(start);
    cy.get("[role=event-end").type(end);
    cy.get("[role=event-detail").type(detail);
    // create event
    cy.get("[role=event-create]").click();
  });
});
