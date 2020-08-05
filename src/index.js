import DomDataBinding from "./DomDataBinding";
import _ from "./Common.Binding";
import ContentPanel from "./plugins/components/ContentPanel"
import Time from "./plugins/components/Time"
import EventsViewer from "./plugins/components/EventsViewer"
import { initEventsFixtures } from "./fixtures";
import TimelineFactory from "./TimelineFactory";
import UiManager from "./UiManager";
import EventsRegistry from "./EventsRegistry";
import ControlPlugin from "./plugins/ControlPlugin";

import "./css/style.css";

/* Timeline */
const initTimeline = function({ tl, video, tlSize }) {
  tl.create({ duration: video.duration, repeat: true });

  video.addEventListener("play", e => {
    tl.start();
  });

  video.addEventListener("pause", e => {
    tl.stop();
  });

  video.addEventListener("seeked", e => {
    tl.goto(video.currentTime * 1000); //currentTime is in sec
  });

  /*** UI in milliseconde ***/
  tl.onStep(e => {
    const { step } = e;
    updateUi({ step, ...rateInfos });
  });

  /*** UI Manager ***/
  const uiManager = new UiManager();
  const rateInfos = { duration: video.duration, tlSize };
  const eventsRegistry = new EventsRegistry({
    timelineMng: tl,
    uiManager: uiManager,
    rateInfos
  });

  uiManager.eventsRegistry = eventsRegistry;
  /* eventRegistry */
  //initEventsFixtures(eventsRegistry);
  /* plugin : use events ui:events */
  uiManager.use(ControlPlugin);
};

const updateUi = function({ step, duration, tlSize }) {
  const normDuration = duration * 1000;
  const STEP_RATE = tlSize / normDuration;
  const indicator = document.querySelectorAll(".indicator")[0];
  const left = Math.floor(step * STEP_RATE);
  indicator.style.transform = `translate(${left}px)`;
};

/* start everything */
const tl = new TimelineFactory();
const video = document.querySelector("#mainvideo_html5_api");
/* init Timeline */
//setTimeout(() => {
  initTimeline({ tl, video, tlSize: 500 });
//}, 500);
