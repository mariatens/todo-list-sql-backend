import express from "express";
import cors from "cors";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config(); //read any .env file(s)

const client = new Client(process.env.DATABASE_URL);

const app = express();

/**
 * Simplest way to connect a front-end. Unimportant detail right now, although you can read more: https://flaviocopes.com/express-cors/
 */
app.use(cors());

/**
 * Middleware to parse a JSON body in requests
 */
app.use(express.json());

//When this route is called, return the most recent 100 tasks in the db
app.get("/", async (req, res) => {
  await client.connect();
  const tasks = await client.query("select * from to_dos order by time desc limit 100"); 
  res.json(tasks.rows)
});

app.get("/completed-tasks", async (req, res) => {
  await client.connect();
  const tasks = await client.query("select * from completed_dos order by completed_time desc limit 100"); 
  res.status(200).json(tasks.rows);
});

app.get("/:id", async (req, res) => {
  // :id indicates a "route parameter", available as req.params.id
  //  see documentation: https://expressjs.com/en/guide/routing.html
  
  const id = parseInt(req.params.id); // params are always string type
  await client.connect();
  const task = "select * from to_dos where id = $1";  
  const searchedId = [id]
  const query = await client.query(task, searchedId) 

  if (task) {
    res.json(query.rows)
      }
  else {
   res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a task with that id identifier",
      },
    });
  }
});

app.post("/", async (req, res) => {
  await client.connect();
  const { task } = req.body;
  const createdTask = await client.query("insert into to_dos (task) values ($1)", [task]); 
    res.json(createdTask.rows) //return the relevant data (including its db-generated id)
  })

//update a task
app.put("/:id", async (req, res) => {
  //  :id refers to a route parameter, which will be made available in req.params.id
  await client.connect();
  const { task } = req.body;
  const id = parseInt(req.params.id);
  const result: any = await client.query("UPDATE to_dos SET task = $1 where id =$2", [task, id]); 
    if (result.rowCount === 1) {
      const updatedTask = result.rows[0];
      res.json(result.rows);
    } else {
      res.status(404).json({
        status: "fail",
        data: {
          id: "Could not find a task with that id identifier",
        },
      });
    }
  })

app.delete("/:id", async (req, res) => {
  await client.connect();
  const id = parseInt(req.params.id); // params are string type
  const queryResult: any = await client.query("DELETE FROM to_dos WHERE id = $1", [id]); 
  const didRemove = queryResult.rowCount === 1;

  if (didRemove) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE#responses
    // we've gone for '200 response with JSON body' to respond to a DELETE
    //  but 204 with no response body is another alternative:
    //  res.status(204).send() to send with status 204 and no JSON body
    res.status(200).json({
      status: "success",
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a task with that id identifier",
      },
    });
  }
});

export default app;
