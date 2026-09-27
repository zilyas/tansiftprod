// Reads and commits content JSON through the GitHub REST API. Each publish is
// one commit (Git Database API), so several edited files ship together and the
// site rebuilds once. The branch update is a fast-forward only, so a change made
// elsewhere in the meantime is detected instead of overwritten.

const API = 'https://api.github.com';

export class GitHub {
  constructor({ token, repo, branch, authorName, authorEmail }) {
    this.token = token;
    this.repo = repo;
    this.branch = branch;
    this.author = { name: authorName, email: authorEmail };
  }

  async #req(method, path, body) {
    const res = await fetch(`${API}/repos/${this.repo}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'tansift-admin',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`GitHub ${method} ${path} failed: ${res.status} ${text.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  async headSha() {
    const ref = await this.#req('GET', `/git/ref/heads/${encodeURIComponent(this.branch)}`);
    return ref.object.sha;
  }

  /** Reads a text file at the branch head. Returns { text, sha } (sha = blob sha). */
  async readFile(path) {
    const data = await this.#req('GET', `/contents/${path}?ref=${encodeURIComponent(this.branch)}`);
    if (Array.isArray(data) || data.type !== 'file') throw new Error(`${path} is not a file`);
    let text;
    if (data.content) {
      text = Buffer.from(data.content, 'base64').toString('utf8');
    } else {
      // Files over 1 MB come back without content; fetch the blob instead.
      const blob = await this.#req('GET', `/git/blobs/${data.sha}`);
      text = Buffer.from(blob.content, 'base64').toString('utf8');
    }
    return { text, sha: data.sha };
  }

  /**
   * Commits several files at once.
   * @param {{path: string, text: string}[]} files
   * @param {string} message
   * @param {string} [expectedHead] head sha the edits were based on
   */
  async commitFiles(files, message, expectedHead) {
    const head = await this.headSha();
    if (expectedHead && expectedHead !== head) {
      const err = new Error('The content changed on GitHub since you opened it. Reload to get the latest version.');
      err.status = 409;
      throw err;
    }
    const commit = await this.#req('GET', `/git/commits/${head}`);
    const tree = [];
    for (const f of files) {
      const blob = await this.#req('POST', '/git/blobs', { content: f.text, encoding: 'utf-8' });
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const newTree = await this.#req('POST', '/git/trees', { base_tree: commit.tree.sha, tree });
    const now = new Date().toISOString();
    const newCommit = await this.#req('POST', '/git/commits', {
      message,
      tree: newTree.sha,
      parents: [head],
      author: { ...this.author, date: now },
      committer: { ...this.author, date: now },
    });
    // force: false → only a fast-forward; fails if someone else committed meanwhile.
    await this.#req('PATCH', `/git/refs/heads/${encodeURIComponent(this.branch)}`, { sha: newCommit.sha, force: false });
    return { sha: newCommit.sha, url: `https://github.com/${this.repo}/commit/${newCommit.sha}` };
  }

  /** Recent commits touching the content folder, for the history panel. */
  async history(limit = 15) {
    const list = await this.#req('GET', `/commits?sha=${encodeURIComponent(this.branch)}&path=content&per_page=${limit}`);
    return list.map((c) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0],
      date: c.commit.author?.date,
      url: c.html_url,
    }));
  }
}
