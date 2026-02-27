import type { ProjectRepo } from "./projectRepo";
import { localProjectRepo } from "./localProjectRepo.dexie";

export const projectRepo: ProjectRepo = localProjectRepo;

// amanhã você troca aqui:
// export const projectRepo: ProjectRepo = firebaseProjectRepo;
