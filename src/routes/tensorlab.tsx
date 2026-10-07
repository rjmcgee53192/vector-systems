import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/components/project-page";
import { TensorlabApp } from "@/projects/tensorlab/app";

export const Route = createFileRoute("/tensorlab")({
  component: () => (
    <ProjectPage id="tensorlab">
      <TensorlabApp />
    </ProjectPage>
  ),
});
