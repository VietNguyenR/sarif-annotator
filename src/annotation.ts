import * as core from "@actions/core";
import { Message, Result } from "sarif";
import { splitEvery } from "ramda";
import { sendRequest } from "github";

const MAX_ANNOTATIONS_PER_REQUEST = 40;

type AnnotationLevel = "notice" | "warning" | "failure";

export type Annotation = {
  path: string;
  start_line?: number;
  end_line?: number;
  start_column?: number;
  end_column?: number;
  annotation_level: AnnotationLevel;
  message: string;
  title: string;
};

export async function publishAnnotation(
  toolName: string,
  annotations: Annotation[]
) {
  if (annotations.length === 0) {
    core.info(`no annotation found, skipping ${toolName}`);
    return;
  }
  core.info(`publishing output for ${toolName}`);
  for (const group of splitEvery(MAX_ANNOTATIONS_PER_REQUEST, annotations)) {
    await sendRequest({
      title: toolName,
      summary: `${annotations.length} issue(s) found.`,
      text: `${annotations.length} issue(s) found.`,
      annotations: group,
    });
  }
}

function convertAnotationLevel(l: string | undefined): AnnotationLevel {
  switch (l) {
    case "error":
      return "failure";
    case "none":
    case "note":
      return "notice";
    case "warning":
      return "warning";
    default:
      return "notice";
  }
}

export function getAnnotationsFromSarifResult(results: Result[]): Annotation[] {
  return results
    .filter((result) => {
      /*
       * Supression of result
       * https://docs.oasis-open.org/sarif/sarif/v2.1.0/csprd01/sarif-v2.1.0-csprd01.html#_Toc10541099
       */
      return (result?.suppressions?.length ?? 0) === 0;
    })
    .map((result) => {
      /*
       * Assume that locations will contain zero or one element.
       * 3.27.12 locations property
       * https://docs.oasis-open.org/sarif/sarif/v2.0/csprd02/sarif-v2.0-csprd02.html#_Toc10127841
       */
      const location = result.locations?.[0].physicalLocation ?? {};
      return {
        path: matchFilePath(location.artifactLocation?.uri || ""),
        start_line: location.region?.startLine,
        end_line: location.region?.endLine || location.region?.startLine,
        start_column:
          location.region?.startLine === location.region?.endLine
            ? location.region?.startColumn
            : undefined,
        end_column:
          location.region?.startLine === location.region?.endLine
            ? location.region?.endColumn
            : undefined,
        annotation_level: convertAnotationLevel(result.level),
        message: stringFromMessage(
          result.message,
          location.region?.startLine ?? 0,
          location.region?.startColumn ?? 0
        ),
        title: result.ruleId ?? "Unspecified",
      };
    });
}

export function matchFilePath(path: string) {
  return new RegExp("(?<=file://).*$").exec(path)?.[0] ?? path;
}

function stringFromMessage(
  message: Message,
  line: number,
  column: number
): string {
  const text = message.text ?? message.markdown ?? "";
  return `${line}:${column}  ${text.replaceAll('"', "'")}`;
}
