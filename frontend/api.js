(function () {
  const PROJECT_STORAGE_KEY = 'morphic_project_id';

  async function request(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data.error || data.message || `Request failed: ${res.status}`;
      throw new Error(message);
    }
    return data;
  }

  async function getActiveProject() {
    const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (stored) {
      try {
        const data = await request(`/api/projects/${stored}`);
        if (data.project) return data.project;
      } catch (_err) {
        localStorage.removeItem(PROJECT_STORAGE_KEY);
      }
    }

    const data = await request('/api/projects');
    const project = data.projects?.[0] || null;
    if (project?.id) localStorage.setItem(PROJECT_STORAGE_KEY, project.id);
    return project;
  }

  function qs(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.set(key, value);
    });
    const text = search.toString();
    return text ? `?${text}` : '';
  }

  window.MorphicApi = {
    request,
    getActiveProject,
    listComicPages(projectId, params) {
      return request(`/api/projects/${projectId}/production/comic/pages${qs(params)}`);
    },
    updateComicPage(projectId, pageId, payload) {
      return request(`/api/projects/${projectId}/production/comic/pages/${pageId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    listComicPanels(projectId, params) {
      return request(`/api/projects/${projectId}/production/comic/panels${qs(params)}`);
    },
    createComicPanel(projectId, payload) {
      return request(`/api/projects/${projectId}/production/comic/panels`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    updateComicPanel(projectId, panelId, payload) {
      return request(`/api/projects/${projectId}/production/comic/panels/${panelId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    listWorkflowStages(projectId, params) {
      return request(`/api/projects/${projectId}/production/workflow/stages${qs(params)}`);
    },
    updateWorkflowStage(projectId, stageKey, payload) {
      return request(`/api/projects/${projectId}/production/workflow/stages/${stageKey}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
  };
})();
