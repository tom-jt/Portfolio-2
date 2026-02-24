import projectsData from "@/data/projects.json";

export type Project = {
  title: string;
  subtitle: string;
  img: string;
  link: string;
  content: string;
  type: ProjectType;
  featured: boolean;
};

export enum ProjectType {
  PROJECT = 0,
  GAME = 1,
}

export const projects: Project[] = (projectsData.projects || []).map((p) => ({
  title: p.title,
  subtitle: p.subtitle ?? "",
  img: (p.img || "").startsWith("public/")
    ? (p.img || "").replace(/^public\//, "/")
    : p.img,
  ctaText: "Visit",
  link: p.link ?? "#",
  content: p.content ?? "",
  type: p.type ?? ProjectType.PROJECT,
  featured: p.featured ?? false,
}));

export const getFilteredProjects = (filterBy: (p: Project) => boolean) =>
  projects.filter(filterBy);
