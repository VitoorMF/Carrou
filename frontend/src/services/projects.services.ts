import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { Project } from "../types/project";

export async function createProject(
    project: Omit<Project, "id" | "createdAt" | "updatedAt">
) {
    const ref = await addDoc(collection(db, "projects"), {
        ...project,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return ref.id;
}
