import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/components/project-page";
import { HeliosApp } from "@/projects/helios/app";

export const Route = createFileRoute("/helios")({
  component: () => (
    <ProjectPage id="helios">
      <HeliosApp />
    </ProjectPage>
  ),
});
