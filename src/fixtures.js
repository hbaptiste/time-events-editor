const initEventsFixtures = function(eventsRegistry) {
  if (!eventsRegistry) {
    return;
  }
  eventsRegistry.add({
    rowName: "author",
    label: "WG sebald",
    start: 10 * 50,
    duration: 120,
    data: {}
  });
  eventsRegistry.add({
    rowName: "concert",
    label: "M.V. Chauvet",
    start: 25 * 20,
    duration: 160,
    data: {}
  });
  eventsRegistry.add({
    rowName: "Concept",
    label: "Nabokov",
    start: 40,
    duration: 10,
    data: {}
  });
  eventsRegistry.add({
    rowName: "Concept",
    label: "D.F. Wallace",
    start: 310,
    duration: 120,
    data: {}
  });
  eventsRegistry.add({
    rowName: "Author",
    label: "Georges Perec",
    name: "Concept",
    start: 500,
    duration: 120,
    data: {}
  });
  eventsRegistry.add({
    rowName: "MyTerm",
    label: "color",
    start: 125,
    duration: 30,
    data: {}
  });
  eventsRegistry.add({
    rowName: "Harris",
    label: "color",
    start: 13 * 125,
    duration: 300,
    data: {}
  });
  eventsRegistry.add({
    rowName: "Harris",
    label: "color",
    start: 15 * 125,
    duration: 500,
    data: {}
  });
};
export { initEventsFixtures };
