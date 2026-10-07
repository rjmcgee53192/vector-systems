import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/components/project-page";
import { ForgeApp } from "@/projects/forge/app";

export const Route = createFileRoute("/forge")({
  component: () => (
    <ProjectPage id="forge">
      <ForgeApp />
    </ProjectPage>
  ),
});
