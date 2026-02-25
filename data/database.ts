import projectsData from "@/data/projects.json";

export type Project = {
  title: string;
  subtitle: string;
  img: string;
  link: string;
  gamelink: string;
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
  link: p.link ?? "#",
  gamelink: p.gamelink ?? "#",
  content: p.content ?? "",
  type: p.type ?? ProjectType.PROJECT,
  featured: projectsData.featured.includes(p.id),
}));

export const getFilteredProjects = (filterBy: (p: Project) => boolean) =>
  projects.filter(filterBy);
