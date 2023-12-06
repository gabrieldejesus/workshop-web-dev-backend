import Fastify from "fastify";
import cors from "@fastify/cors";

import { Database } from "./local-database.js";

const server = Fastify();
await server.register(cors, { "Access-Control-Allow-Origin": "*" });

const database = new Database();

server.post("/summarizations", (request, response) => {
  const { title, link, startAt, endAt } = request.body;

  /**
   * Receber os dados do meu front-end
   * Validar os dados recebidos do meu front-end
   * Transformar o video do link em um áudio e salvar ele temporariamente na pasta public/audios
   * Enviar o audio para a API do assemblyai e pegar o job id daquela tarefa
   * Salvar o id do job no banco de dados
   */

  database.create({ title: title, link: link, startAt: startAt, endAt: endAt });

  return response.status(201);
});

server.get("/summarizations", (request, response) => {
  const search = request.query.search;
  const summarizations = database.list(search);

  return response.status(200).send(summarizations);
});

server.put("/summarizations/:id", (request, response) => {
  const summarizationId = request.params.id;
  const { title, link, startAt, endAt } = request.body;

  database.update(summarizationId, {
    title: title,
    link: link,
    startAt: startAt,
    endAt: endAt,
  });

  return response.status(204)
});

server.delete("/summarizations/:id", (request, response) => {
  const summarizationId = request.params.id;
  database.delete(summarizationId);

  return response.status(200)
});

server.listen({ port: 3030 });

console.log("Server listening on port: 3030");
