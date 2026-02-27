import type { Project } from "../types/project";

export interface ProjectRepo {
    get(id: string): Promise<Project | null>;
    upsert(p: Project): Promise<void>;
    list(): Promise<Project[]>;
    remove(id: string): Promise<void>;
}
