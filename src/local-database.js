import { randomUUID } from "node:crypto";

export class Database {
  #summarizations = new Map();

  create(summarization) {
    const summarizationId = randomUUID();

    this.#summarizations.set(summarizationId, summarization);
  }

  list(search) {
    return Array.from(this.#summarizations.entries())
      .map((summarizationArray) => {
        const id = summarizationArray[0];
        const data = summarizationArray[1];

        return { id, ...data };
      })
      .filter((summarization) => {
        if (search) {
          return summarization.title.includes(search);
        }

        return true; 
      });
  }

  update(id, summarization) {
    this.#summarizations.set(id, summarization)
  }

  delete(id) {
    this.#summarizations.delete(id)
  }
}
