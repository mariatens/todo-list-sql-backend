import express from "express";
import cors from "cors";
import { Client } from "pg";


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

//When this route is called, return the most recent 100 signatures in the db
app.get("/", async (req, res) => {
  await client.connect();
  const signatures = await client.query("select * from to_dos order by time desc limit 100"); //FIXME-TASK: get signatures from db!
  res.status(200).json({
    status: "success",
    data: {
      signatures
    },
  });
});

app.get("/completed-tasks", async (req, res) => {
  const signatures = await client.query("select * from completed_dos order by time desc limit 100"); //FIXME-TASK: get signatures from db!
  res.status(200).json({
    status: "success",
    data: {
      signatures
    },
  });
});

app.get("/:id", async (req, res) => {
  // :id indicates a "route parameter", available as req.params.id
  //  see documentation: https://expressjs.com/en/guide/routing.html
  const id = parseInt(req.params.id); // params are always string type

  const signature = "select * from to_dos where id = $1";   ////FIXME-TASK get the signature row from the db (match on id)
  const searchedId = [id]
  const query = await client.query(signature, searchedId) 

  if (signature) {
    res.status(200).json({
      status: "success",
      data: {
        query,
      },
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a signature with that id identifier",
      },
    });
  }
});

app.post("/", async (req, res) => {
  await client.connect();
  const { task } = req.body;
  const createdSignature = await client.query("insert into to_dos (task) values ($1)", [task]); 
    res.status(201).json({
      status: "success",
      data: {
        signature: createdSignature, //return the relevant data (including its db-generated id)
      },
    });})

//update a signature.
app.put("/:id", async (req, res) => {
  //  :id refers to a route parameter, which will be made available in req.params.id
  await client.connect();
  const { task } = req.body;
  const id = parseInt(req.params.id);
  const result: any = await client.query("UPDATE to_dos SET task = $1 where id =$2 returning *", [task, id]); 
    if (result.rowCount === 1) {
      const updatedSignature = result.rows[0];
      res.status(200).json({
        status: "success",
        data: {
          signature: updatedSignature,
        },
      });
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
  const id = parseInt(req.params.id); // params are string type
  const queryResult: any = await client.query("DELETE FROM signatures WHERE id = $1", [id]); 
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
        id: "Could not find a signature with that id identifier",
      },
    });
  }
});

export default app;
