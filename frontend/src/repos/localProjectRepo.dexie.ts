import Dexie, { type Table } from "dexie";
import type { Project } from "../types/project";
import type { ProjectRepo } from "./projectRepo";

type ProjectRow = Project; // por enquanto 1:1

class CarrosselizeDB extends Dexie {
    projects!: Table<ProjectRow, string>;

    constructor() {
        super("carrosselize-db");
        this.version(1).stores({
            // primary key: id
            // index: updatedAt (pra list ordenada)
            projects: "id, updatedAt, createdAt",
        });
    }
}

const db = new CarrosselizeDB();

export const localProjectRepo: ProjectRepo = {
    async get(id) {
        const p = await db.projects.get(id);
        return p ?? null;
    },

    async upsert(p) {
        await db.projects.put(p);
    },

    async list() {
        // ordena por updatedAt desc
        const items = await db.projects.orderBy("updatedAt").reverse().toArray();
        return items;
    },

    async remove(id) {
        await db.projects.delete(id);
    },
};
