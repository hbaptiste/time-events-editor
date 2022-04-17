import CustomElement from "../CustomElement";
import TimelineFactory from "../TimelineFactory";
import UiManager from "../UiManager";
import ControlPlugin from "./ControlPlugin";
import EventsRegistry from "../EventsRegistry";
import { messages } from "../fixtures";

/**
 * to do :
 * - ref on elements
 * - handle list / debug list
 * - debug selector
 * - Decorator ?
 */

CustomElement.register({
  is: "root-app",
  properties: ["event"],
  data: {
    content: null,
    isPlayerReady: false,
  },

  onInit: function () {
    const tl = new TimelineFactory();
    const initTimeline = this.initTimeline.bind(this);
    /* testing fixtures */
    document.body.onload = function () {
      const video = document.querySelector("#mainvideo_html5_api");
      video.oncanplay = () => {
        initTimeline({ tl, video, tlSize: 500 });
      };
    };
  },

  initTimeline: function ({ tl, video, tlSize }) {
    if (this.data.isPlayerReady) {
      return;
    }

    tl.create({ duration: video.duration, repeat: true });

    video.addEventListener("play", (_e) => {
      tl.start();
    });

    video.addEventListener("pause", (_e) => {
      tl.stop();
    });

    video.addEventListener("seeked", (_e) => {
      tl.goto(video.currentTime * 1000); //currentTime is in sec
      const { rateInfos } = this.$store.getState();

      const payload = { rateInfos, position: video.duration };
      // console.log(video.currentTime);
      this.$store.emit({ type: "NEW_TICK", payload });
    });

    /*** UI Manager ***/
    const rateInfos = { duration: video.duration, tlSize };
    const initState = {
      rateInfos,
      messages,
      currentEvent: null,
      currentPosition: 0,
    };

    const eventsRegistry = new EventsRegistry({
      timelineMng: tl,
      //uiManager: uiManager,
      rateInfos,
    });

    this.$store.init({ ...initState });

    // UI Manager
    const uiManager = new UiManager();
    uiManager.eventsRegistry = eventsRegistry;
    uiManager.use(ControlPlugin);

    // update player state
    this.data.isPlayerReady = true;
  },

  getTemplate: function () {
    return `
        <template>
            <div class="main-wrapper">
                <div style="float: left; border: 1px salmon" style="width: 500px; height: 360px">
                    <video id="mainvideo_html5_api" class="vjs-tech" controls preload="true" poster="http://www.college-de-france.fr/video/yanick-lahens/2019/lahens-20190603_thumb.jpg">
                        <source src="http://www.college-de-france.fr/video/yanick-lahens/2019/lahens-20190603.mp4" type="video/mp4"/>
                    </video>
                    <div class="controls-wrapper" style="margin-bottom: 3px; background:white; width:500px"></div>
                    <div id="eventContainer" class="component events-container"></div>
                </div>
                <content-panel style="float:left" @showIf="displayEventsList" title="Radical blaze title!" @onSelect="_handleItemSelection"></content-panel>
                <div style="clear:both"></div>
              </div>
        </template>`;
  },
});
