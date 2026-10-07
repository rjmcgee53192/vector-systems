import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/components/project-page";
import { VoltgridApp } from "@/projects/voltgrid/app";

export const Route = createFileRoute("/voltgrid")({
  component: () => (
    <ProjectPage id="voltgrid">
      <VoltgridApp />
    </ProjectPage>
  ),
});
