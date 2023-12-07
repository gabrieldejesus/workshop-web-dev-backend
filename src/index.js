import { z } from "zod";
import ytdl from "ytdl-core";
import Fastify from "fastify";
import cors from "@fastify/cors";
import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "node:crypto";

import { Database } from "./local-database.js";

const server = Fastify();
await server.register(cors, { "Access-Control-Allow-Origin": "*" });

const database = new Database();

const audioSchema = z.object({
  title: z.string(),
  link: z
    .string()
    .regex(
      new RegExp(/https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/)
    ),
  startAt: z.number(),
  endAt: z.number(),
});

server.post("/summarizations", async (request, response) => {
  try {
    const { title, link, startAt, endAt } = request.body;

    const data = audioSchema.parse({ title, link, startAt, endAt });

    const videoReadableStream = ytdl(data.link, { quality: "lowestaudio" });

    const filename = `${randomUUID()}.mp3`;
    const outputFolder = "public/audios/"

    const ffmpegCommand = ffmpeg(videoReadableStream)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .seekInput(data.startAt)
      .duration(data.endAt - data.startAt)
      .format("mp3")
      .output(`${outputFolder}${filename}`);

    await new Promise((resolve, reject) => {
      ffmpegCommand.on("end", resolve);
      ffmpegCommand.on("error", reject);
      ffmpegCommand.run();
    });

    /**
     * ✅ Receber os dados do meu front-end
     * ✅ Validar os dados recebidos do meu front-end
     * ✅ Transformar o video do link em um áudio e salvar ele temporariamente na pasta public/audios
     * Enviar o audio para a API do assemblyai e pegar o job id daquela tarefa
     * Salvar o id do job no banco de dados
     */

    database.create({
      title: title,
      link: link,
      startAt: startAt,
      endAt: endAt,
    });

    return response.status(201).send({ success: true });
  } catch (error) {
    return response.status(500).send({ success: false, message: error });
  }
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

  return response.status(204);
});

server.delete("/summarizations/:id", (request, response) => {
  const summarizationId = request.params.id;
  database.delete(summarizationId);

  return response.status(200);
});

server.listen({ port: 3030 });

console.log("Server listening on port: 3030");
