import { simpleGit } from "simple-git";

export async function cloneRepository(
  url: string,
  destPath: string,
  branch: string = "main",
): Promise<void> {
  const git = simpleGit();
  await git.clone(url, destPath, ["--depth", "1", "--branch", branch]);
}
