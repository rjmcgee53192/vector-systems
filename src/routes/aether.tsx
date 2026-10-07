import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/components/project-page";
import { AetherApp } from "@/projects/aether/app";

export const Route = createFileRoute("/aether")({
  component: () => (
    <ProjectPage id="aether">
      <AetherApp />
    </ProjectPage>
  ),
});
