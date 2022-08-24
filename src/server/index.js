import express from "express";
import { getAllEvents, createEvent, getEventById } from "../api/services/events.service";
import { getContentById, createContent } from "../api/services/content.service";
import { createRelationShip } from "../api/services/relationShip.service";
import bodyParser from "body-parser";

/** Express */
const app = express();
const port = 3001;

//app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/events", async (req, res) => {
  try {
    const events = await getAllEvents();
    res.status(200).json(events);
  } catch (reason) {
    console.log(reason.message);
  }
});

app.get("/event", async (req, res) => {
  try {
    const event = await createEvent({
      start: "00:00:10",
      end: "00:00:30",
      createdAt: new Date().toISOString(),

      content: {
        create: {
          value: "this is my content",
          toRelationShip: {
            create: [
              {
                sourceId: 1,
                verb: "TEST",
              },
            ],
          },
        },
      },
    });
    res.status(200).send(event);
    console.log(event);
    return;
  } catch (reason) {
    console.log(reason);
    console.log("reason");
  }
});

// get one event
app.get("/event/:id", async (req, res) => {
  const id = req.params.id;
  const evt = await getEventById(id);
  console.log(evt);
  res.status(200).send(evt);
});

app.get("/content/:id", async (req, res) => {
  const id = req.params.id;
  const content = await getContentById(id);
  return res.status(200).send(content);
});

// make a link from a contentNode to an other
// co
app.post("/content/:id/link", async (req, res) => {
  const body = req.body; //
  const id = req.params.id;

  //content -link
  try {
    const mainContent = await getContentById(id);
    const newContent = createContent(body);
    return await createRelationShip({
      sourceId: id,
      targetId: (await newContent).id,
      verb: "link",
    });
  } catch (reason) {
    return res.status(404);
  }
});

// serve statics
app.use(express.static("static"));

app.listen(port, () => {
  console.log(`app listening on ${port} port!`);
});
