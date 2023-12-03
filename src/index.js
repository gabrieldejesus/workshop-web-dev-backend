import Fastify from "fastify";

import { Database } from "./local-database.js";

const server = Fastify();
const database = new Database();

server.post("/summarization", (request, response) => {
  const { title, link, startAt, endAt } = request.body;

  database.create({ title: title, link: link, startAt: startAt, endAt: endAt });

  return response.status(201).send();
});

server.get("/summarization", (request, response) => {
  const search = request.query.search;
  const summarizations = database.list(search);

  return response.status(200).send(summarizations);
});

server.put("/summarization/:id", (request, response) => {
  const summarizationId = request.params.id;
  const { title, link, startAt, endAt } = request.body;

  database.update(summarizationId, {
    title: title,
    link: link,
    startAt: startAt,
    endAt: endAt,
  });

  return response.status(204).send();
});

server.delete("/summarization/:id", (request, response) => {
  const summarizationId = request.params.id;
  database.delete(summarizationId);

  return response.status(200).send();
});

server.listen({ port: 3030 });

console.log("Server listening on port: 3030");
