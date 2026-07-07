const TOOL_PLANS = [
  {
    key: 'comfyui',
    category: 'AI Image & Visual Generation',
    match: ['comfy', 'stable-diffusion', 'sdxl', 'flux', 'image-generation'],
    name: 'ComfyUI',
    workflow: 'Primary visual generation engine for character generation, backgrounds, style workflows, custom pipelines, comics, and animation assets.',
    adapter: 'comfyuiAdapter',
    phase: 'phase_2_primary_visual_engine',
    writesTo: ['assets', 'storage_objects', 'comic_panels.metadata', 'style_presets'],
    firstMilestone: 'Generate one test image from a saved panel prompt and store it as an Asset Library record.',
    requiredChecks: ['License compatibility', 'Model license and provenance', 'GPU/runtime strategy', 'Workflow JSON import/export', 'Output file storage path'],
  },
  {
    key: 'fabricjs',
    category: 'Canvas & Graphics',
    match: ['fabric', 'fabricjs', 'fabric.js'],
    name: 'Fabric.js',
    workflow: '2D canvas editing, object manipulation, and design tools for comic/page composition.',
    adapter: 'fabricCanvasAdapter',
    phase: 'phase_2_canvas_candidate',
    writesTo: ['comic_panels.metadata', 'comic_pages.metadata', 'assets', 'storage_objects'],
    firstMilestone: 'Save and reload a simple panel layout with editable text, images, and object positions.',
    requiredChecks: ['Canvas JSON schema', 'Export format', 'Layer/object mapping', 'Asset reference strategy', 'Editor performance'],
  },
  {
    key: 'konvajs',
    category: 'Canvas & Graphics',
    match: ['konva', 'konvajs', 'konva.js'],
    name: 'Konva.js',
    workflow: 'Interactive canvas, layers, selection tools, and rich editor functionality.',
    adapter: 'konvaCanvasAdapter',
    phase: 'phase_2_canvas_candidate',
    writesTo: ['comic_panels.metadata', 'comic_pages.metadata', 'assets', 'storage_objects'],
    firstMilestone: 'Prototype selectable panel objects with layer save/load and transform metadata.',
    requiredChecks: ['Layer model', 'Selection/transform behavior', 'Serialization format', 'Mobile input support', 'Performance at page scale'],
  },
  {
    key: 'pixijs',
    category: 'Canvas & Graphics',
    match: ['pixi', 'pixijs', 'pixi.js', 'webgl'],
    name: 'PixiJS',
    workflow: 'High-performance rendering, GPU/WebGL acceleration, and animation previews.',
    adapter: 'pixiPreviewAdapter',
    phase: 'phase_2_preview_candidate',
    writesTo: ['motion_sequences.metadata', 'animation_assets', 'assets'],
    firstMilestone: 'Preview a short motion-comic sequence from saved panels and motion cues.',
    requiredChecks: ['Renderer lifecycle', 'Asset preloading', 'Timeline cue mapping', 'Fallback behavior', 'Browser compatibility'],
  },
  {
    key: 'nextjs',
    category: 'Web Framework',
    match: ['next', 'nextjs', 'next.js'],
    name: 'Next.js',
    workflow: 'Future main frontend framework for routing, app structure, server rendering, and deployment ergonomics.',
    adapter: 'frontendMigrationPlan',
    phase: 'phase_2_framework_migration_candidate',
    writesTo: ['frontend_app', 'docs/ARCHITECTURE.md'],
    firstMilestone: 'Document the migration plan from static pages to a Next.js app without breaking current Express API routes.',
    requiredChecks: ['Routing map', 'API proxy/deployment model', 'Static asset migration', 'Auth/session strategy', 'Incremental migration path'],
  },
  {
    key: 'react',
    category: 'Web Framework',
    match: ['react', 'reactjs', 'react.js'],
    name: 'React',
    workflow: 'UI library for reusable editor components, stateful panels, and production workflow screens.',
    adapter: 'reactComponentPlan',
    phase: 'phase_2_ui_migration_candidate',
    writesTo: ['frontend_components', 'docs/ARCHITECTURE.md'],
    firstMilestone: 'Convert one isolated production card into a reusable React component once framework migration starts.',
    requiredChecks: ['Component boundaries', 'State management', 'Design token mapping', 'Build pipeline', 'Regression strategy'],
  },
  {
    key: 'redis',
    category: 'Backend',
    match: ['redis', 'cache', 'session'],
    name: 'Redis',
    workflow: 'Caching, session storage, and queue backend support.',
    adapter: 'redisRuntimeAdapter',
    phase: 'phase_2_backend_runtime_candidate',
    writesTo: ['queue_config', 'project_settings', 'workflow_stages'],
    firstMilestone: 'Configure Redis-backed health checks and a safe queue connection setting without changing existing data contracts.',
    requiredChecks: ['Connection URL handling', 'Secret storage', 'Local/dev fallback', 'Persistence policy', 'Monitoring'],
  },
  {
    key: 'bullmq',
    category: 'Backend',
    match: ['bull', 'bullmq', 'queue', 'jobs'],
    name: 'BullMQ',
    workflow: 'Background job queue for AI task processing and long-running production workflows.',
    adapter: 'bullmqQueueAdapter',
    phase: 'phase_2_backend_runtime_candidate',
    writesTo: ['generation_jobs', 'workflow_stages', 'assets'],
    firstMilestone: 'Move one non-critical AI or export task into a queued job with status updates.',
    requiredChecks: ['Redis dependency', 'Retry policy', 'Job payload schema', 'Progress events', 'Dead-letter/error handling'],
  },
  {
    key: 'socketio',
    category: 'Real-Time Communication',
    match: ['socket', 'socket.io', 'websocket', 'realtime', 'real-time'],
    name: 'Socket.IO',
    workflow: 'Live collaboration, real-time updates, and progress tracking.',
    adapter: 'socketIoRealtimeAdapter',
    phase: 'phase_2_realtime_candidate',
    writesTo: ['workflow_stages', 'generation_jobs', 'collaboration_events'],
    firstMilestone: 'Broadcast queue/job progress to the dashboard without enabling multi-user editing yet.',
    requiredChecks: ['Auth/session model', 'Room/project isolation', 'Event schema', 'Reconnect behavior', 'Rate limiting'],
  },
  {
    key: 'git',
    category: 'Version Control',
    match: ['git'],
    name: 'Git',
    workflow: 'Version control for Morphic Studio source, documentation, and release history.',
    adapter: 'developmentWorkflow',
    phase: 'development_workflow_only',
    writesTo: ['repository_history', 'docs'],
    firstMilestone: 'Keep implementation changes committed with clear feature-oriented messages.',
    requiredChecks: ['Branch policy', 'Commit hygiene', 'Release tagging', 'Contributor workflow', 'Rollback plan'],
  },
  {
    key: 'github',
    category: 'Version Control',
    match: ['github', 'pull-request', 'pr'],
    name: 'GitHub',
    workflow: 'Remote repository hosting, pull requests, issues, and project collaboration.',
    adapter: 'developmentWorkflow',
    phase: 'development_workflow_only',
    writesTo: ['pull_requests', 'issues', 'docs'],
    firstMilestone: 'Use pull requests and project docs to track Phase 1/Phase 2 delivery.',
    requiredChecks: ['Repo permissions', 'Issue labels', 'PR template', 'Secrets policy', 'Release process'],
  },
  {
    key: 'opentimelineio',
    category: 'Research Additions',
    match: ['opentimelineio', 'otio', 'timeline'],
    name: 'OpenTimelineIO',
    workflow: 'Timeline import/export research for animation and video tool interoperability.',
    adapter: 'openTimelineIoAdapter',
    phase: 'research_candidate',
    writesTo: ['motion_sequences.metadata', 'workflow_stages', 'assets'],
    firstMilestone: 'Map Morphic motion cues to an OTIO-style timeline export document.',
    requiredChecks: ['Timeline schema fit', 'Import/export direction', 'Tool compatibility', 'Metadata preservation', 'Versioning'],
  },
  {
    key: 'opencolorio',
    category: 'Research Additions',
    match: ['opencolorio', 'ocio', 'color'],
    name: 'OpenColorIO',
    workflow: 'Color-management research for consistent comics, animation, and rendering output.',
    adapter: 'openColorIoAdapter',
    phase: 'research_candidate',
    writesTo: ['style_presets', 'project_settings', 'assets.metadata'],
    firstMilestone: 'Document whether Morphic needs project-level color configuration before render/export tooling.',
    requiredChecks: ['Color pipeline complexity', 'Target formats', 'Renderer compatibility', 'Artist-facing controls', 'Default config strategy'],
  },
  {
    key: 'development-assistants',
    category: 'AI Coding Assistants',
    match: ['antigravity', 'codex', 'claude code', 'jules'],
    name: 'AI coding assistants',
    workflow: 'Development workflow support only; not embedded in the creator website.',
    adapter: 'developmentWorkflow',
    phase: 'development_workflow_only',
    writesTo: ['docs/CURRENT_SPRINT.md', 'pull_requests'],
    firstMilestone: 'Use assistants for implementation support while keeping all website features reviewed and committed normally.',
    requiredChecks: ['Secret handling', 'Code review', 'Prompt traceability', 'Human approval', 'Repository scope'],
  },
];

const EXCLUDED_TOOLS = [
  { name: 'Replit', reason: 'Removed from the Morphic website stack.' },
  { name: 'Odyssey', reason: 'Research only; not selected for implementation.' },
  { name: 'Additional image-generation engines', reason: 'ComfyUI is sufficient for now.' },
  { name: 'Git Workflow Skill', reason: 'Postponed.' },
];

const PLANNED_SYSTEMS = [
  'Character Consistency Engine',
  'Style Consistency Engine',
  'Comic Generation Pipeline',
  'Animation Pipeline',
  'Visual Identity Engine',
  'Story Pipeline',
  'Local Organizer',
  'AI Communication System',
];

function normalizeInput(input = '') {
  return String(input).trim();
}

function repoNameFromInput(input) {
  const value = normalizeInput(input);
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.hostname.includes('github.com') ? url.pathname.replace(/^\//, '').replace(/\/$/, '') : value;
  } catch (_err) {
    return value;
  }
}

function findPlan(repoName) {
  const lower = repoName.toLowerCase();
  return TOOL_PLANS.find(plan => plan.match.some(token => lower.includes(token))) || {
    key: 'unknown',
    category: 'Unclassified',
    name: repoName || 'Unknown tool',
    workflow: 'Needs owner decision: asset, comic, motion-comic, animation, voice, auth, export, or developer tooling.',
    adapter: 'customAdapter',
    phase: 'phase_1_evaluation_required',
    writesTo: ['project_settings', 'workflow_stages'],
    firstMilestone: 'Create an adapter brief and prove one safe output can be saved back to a Morphic record.',
    requiredChecks: ['License compatibility', 'Maintenance activity', 'Security posture', 'Runtime requirements', 'Data record ownership'],
  };
}

export function listOpenSourceCatalog() {
  return {
    tools: TOOL_PLANS.map(({ match, ...plan }) => plan),
    plannedSystems: PLANNED_SYSTEMS,
    excluded: EXCLUDED_TOOLS,
  };
}

export function evaluateOpenSourceTool(input) {
  const repo = repoNameFromInput(input);
  const plan = findPlan(repo);
  const isDevelopmentOnly = plan.phase === 'development_workflow_only';
  const isResearch = plan.phase === 'research_candidate';
  return {
    repo,
    ...plan,
    decision: isDevelopmentOnly
      ? 'Keep this in the development workflow; do not embed it in the creator-facing website.'
      : isResearch
        ? 'Keep this on the research list until the related timeline/color workflow becomes necessary.'
        : 'Proceed only through the adapter layer after Phase 1 save/load contracts are stable.',
    phaseOrder: [
      'Phase 1: confirm license, security, runtime, storage, and exact Morphic records touched.',
      'Phase 2: build a thin adapter that writes one test output back to Asset Library or the relevant production table.',
      'Phase 3: expose the adapter behind a reviewed UI action, queue job, and workflow stage status.',
    ],
  };
}
