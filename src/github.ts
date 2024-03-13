import { context, getOctokit } from "@actions/github";
import * as core from "@actions/core";
import { Annotation } from "./annotation";

type Output = {
  title: string;
  summary: string;
  text: string;
  annotations: Annotation[];
};

export async function sendRequest(output: Output) {
  const token = core.getInput("token");
  const octokit = getOctokit(token);
  let sha = context.sha;
  if (context.payload.pull_request) {
    sha = context.payload.pull_request.head.sha;
  }
  const request = {
    ...context.repo,
    ref: sha,
  };

  const result = await octokit.rest.checks.listForRef(request);
  const exists = result.data.check_runs.find(
    (check) => check.name === context.workflow
  );
  const accept = "application/vnd.github.v3+json";
  if (exists) {
    core.info("check exists, reusing...");
    const id = exists.id;
    await octokit.rest.checks.update({
      ...context.repo,
      accept,
      conclusion: "success",
      check_run_id: id,
      status: "completed",
      output,
    });
  } else {
    core.info("check does not exist, creating new...");
    const createRequest = {
      ...context.repo,
      accept,
      head_sha: sha,
      conclusion: "success",
      name: context.workflow,
      status: "completed",
      output,
    };
    await octokit.rest.checks.create(createRequest);
  }
}
