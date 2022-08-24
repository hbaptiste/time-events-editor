// import DomDataBinding from "./DomDataBinding";
// import { initEventsFixtures } from "./fixtures";

import "./Common.Binding";
import "./plugins/components/ContentPanel";
import "./plugins/components/Time";
import "./plugins/components/EventsViewer";
import "./UiManager";
import "./EventsRegistry";
import "./plugins/components/EventForm";
import "./plugins/components/EventsRow";
import "./plugins/components/ContentViewer";
import "./plugins/components/ContentEditor";

import "./plugins/App";
import "./css/style.css";
import CustomElement from "./CustomElement";

/* render app */
CustomElement.render("root-app", document.getElementById("app-root"));
