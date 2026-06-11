import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = 'test-secret';

const store = vi.hoisted(() => ({
  users: [],
  projects: [],
  tasks: [],
  nextUserId: 1,
  nextProjectId: 1,
  nextTaskId: 1,
}));

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    currentModule: user.current_module,
    github: user.github,
    portfolio: user.portfolio,
    resumeStatus: user.resume_status,
  };
}

function publicProject(project) {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    createdAt: project.created_at,
    taskCount: store.tasks.filter((task) => task.project_id === project.id).length,
  };
}

function publicTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    category: task.category,
    dueDate: task.due_date,
    projectId: task.project_id,
    completedAt: task.completed_at,
    createdAt: task.created_at,
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function resetStore() {
  store.users = [];
  store.projects = [];
  store.tasks = [];
  store.nextUserId = 1;
  store.nextProjectId = 1;
  store.nextTaskId = 1;
}

function prepare(sql) {
  const normalized = sql.replace(/\s+/g, ' ').trim();

  return {
    get(...params) {
      if (normalized === 'SELECT id FROM users WHERE email = ?') {
        const user = store.users.find((candidate) => candidate.email === params[0]);
        return user ? { id: user.id } : undefined;
      }

      if (normalized.includes('FROM users WHERE id = ?') && normalized.includes('current_module AS currentModule')) {
        const user = store.users.find((candidate) => candidate.id === Number(params[0]));
        return user ? publicUser(user) : undefined;
      }

      if (normalized === 'SELECT * FROM users WHERE email = ?') {
        return store.users.find((candidate) => candidate.email === params[0]);
      }

      if (normalized === 'SELECT * FROM users WHERE id = ?') {
        return store.users.find((candidate) => candidate.id === Number(params[0]));
      }

      if (normalized.includes('SELECT p.id') && normalized.includes('FROM projects p WHERE p.id = ?')) {
        const project = store.projects.find((candidate) => candidate.id === Number(params[0]));
        return project ? publicProject(project) : undefined;
      }

      if (normalized === 'SELECT * FROM projects WHERE id = ? AND owner_id = ?') {
        return store.projects.find(
          (candidate) => candidate.id === Number(params[0]) && candidate.owner_id === Number(params[1])
        );
      }

      if (normalized === 'SELECT id FROM projects WHERE id = ? AND owner_id = ?') {
        const project = store.projects.find(
          (candidate) => candidate.id === Number(params[0]) && candidate.owner_id === Number(params[1])
        );
        return project ? { id: project.id } : undefined;
      }

      if (normalized.includes('SELECT id, title, description, status, priority, category') && normalized.includes('FROM tasks WHERE id = ?')) {
        const task = store.tasks.find((candidate) => candidate.id === Number(params[0]));
        return task ? publicTask(task) : undefined;
      }

      if (normalized === 'SELECT * FROM tasks WHERE id = ? AND owner_id = ?') {
        return store.tasks.find(
          (candidate) => candidate.id === Number(params[0]) && candidate.owner_id === Number(params[1])
        );
      }

      if (normalized.includes("SELECT COUNT(*) AS n FROM tasks WHERE owner_id = ? AND status = 'complete'")) {
        return { n: store.tasks.filter((task) => task.owner_id === Number(params[0]) && task.status === 'complete').length };
      }

      if (normalized.includes("SELECT COUNT(*) AS n FROM tasks WHERE owner_id = ? AND status != 'complete' AND due_date = date('now', 'localtime')")) {
        return {
          n: store.tasks.filter(
            (task) => task.owner_id === Number(params[0]) && task.status !== 'complete' && task.due_date === today()
          ).length,
        };
      }

      if (normalized.includes("SELECT COUNT(*) AS n FROM tasks WHERE owner_id = ? AND status != 'complete'")) {
        return { n: store.tasks.filter((task) => task.owner_id === Number(params[0]) && task.status !== 'complete').length };
      }

      if (normalized === 'SELECT COUNT(*) AS n FROM projects WHERE owner_id = ?') {
        return { n: store.projects.filter((project) => project.owner_id === Number(params[0])).length };
      }

      if (normalized.includes("SELECT COUNT(*) AS n FROM tasks WHERE owner_id = ? AND completed_at >= datetime('now', '-7 days')")) {
        return { n: store.tasks.filter((task) => task.owner_id === Number(params[0]) && task.completed_at).length };
      }

      if (normalized === 'SELECT current_module AS m FROM users WHERE id = ?') {
        const user = store.users.find((candidate) => candidate.id === Number(params[0]));
        return { m: user?.current_module };
      }

      throw new Error(`Unhandled db.get SQL: ${normalized}`);
    },

    all(...params) {
      if (normalized.includes('SELECT p.id') && normalized.includes('FROM projects p WHERE p.owner_id = ?')) {
        return store.projects
          .filter((project) => project.owner_id === Number(params[0]))
          .map(publicProject)
          .reverse();
      }

      if (normalized.includes('SELECT id, title, description, status, priority, category') && normalized.includes('FROM tasks WHERE owner_id = ?')) {
        let tasks = store.tasks.filter((task) => task.owner_id === Number(params[0]));
        if (normalized.includes('AND project_id = ?')) {
          tasks = tasks.filter((task) => task.project_id === Number(params[1]));
        }
        if (normalized.includes('AND status = ?')) {
          const statusParam = normalized.includes('AND project_id = ?') ? params[2] : params[1];
          tasks = tasks.filter((task) => task.status === statusParam);
        }
        return tasks.map(publicTask).reverse();
      }

      throw new Error(`Unhandled db.all SQL: ${normalized}`);
    },

    run(...params) {
      if (normalized === 'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)') {
        const user = {
          id: store.nextUserId++,
          name: params[0],
          email: params[1],
          password_hash: params[2],
          current_module: 1,
          github: '',
          portfolio: '',
          resume_status: 'not-started',
          created_at: '2026-06-11 12:00:00',
        };
        store.users.push(user);
        return { lastInsertRowid: user.id };
      }

      if (normalized.includes('UPDATE users SET name = ?, current_module = ?, github = ?, portfolio = ?, resume_status = ? WHERE id = ?')) {
        const user = store.users.find((candidate) => candidate.id === Number(params[5]));
        Object.assign(user, {
          name: params[0],
          current_module: params[1],
          github: params[2],
          portfolio: params[3],
          resume_status: params[4],
        });
        return {};
      }

      if (normalized === 'INSERT INTO projects (title, description, owner_id) VALUES (?, ?, ?)') {
        const project = {
          id: store.nextProjectId++,
          title: params[0],
          description: params[1],
          owner_id: Number(params[2]),
          created_at: '2026-06-11 12:00:00',
        };
        store.projects.push(project);
        return { lastInsertRowid: project.id };
      }

      if (normalized === 'UPDATE projects SET title = ?, description = ? WHERE id = ?') {
        const project = store.projects.find((candidate) => candidate.id === Number(params[2]));
        Object.assign(project, { title: params[0], description: params[1] });
        return {};
      }

      if (normalized === 'DELETE FROM projects WHERE id = ?') {
        const projectId = Number(params[0]);
        store.projects = store.projects.filter((project) => project.id !== projectId);
        store.tasks = store.tasks.filter((task) => task.project_id !== projectId);
        return {};
      }

      if (normalized.includes('INSERT INTO tasks (title, description, status, priority, category, due_date, project_id, owner_id, completed_at)')) {
        const task = {
          id: store.nextTaskId++,
          title: params[0],
          description: params[1],
          status: params[2],
          priority: params[3],
          category: params[4],
          due_date: params[5],
          project_id: params[6],
          owner_id: Number(params[7]),
          completed_at: params[8],
          created_at: '2026-06-11 12:00:00',
        };
        store.tasks.push(task);
        return { lastInsertRowid: task.id };
      }

      if (normalized.includes('UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, category = ?, due_date = ?, project_id = ?, completed_at = ? WHERE id = ?')) {
        const task = store.tasks.find((candidate) => candidate.id === Number(params[8]));
        Object.assign(task, {
          title: params[0],
          description: params[1],
          status: params[2],
          priority: params[3],
          category: params[4],
          due_date: params[5],
          project_id: params[6],
          completed_at: params[7],
        });
        return {};
      }

      if (normalized === 'DELETE FROM tasks WHERE id = ?') {
        store.tasks = store.tasks.filter((task) => task.id !== Number(params[0]));
        return {};
      }

      throw new Error(`Unhandled db.run SQL: ${normalized}`);
    },
  };
}

vi.mock('./db.js', () => ({
  default: {
    prepare,
  },
}));

const authRoutes = await import('./routes/auth.js').then((module) => module.default);
const userRoutes = await import('./routes/users.js').then((module) => module.default);
const projectRoutes = await import('./routes/projects.js').then((module) => module.default);
const taskRoutes = await import('./routes/tasks.js').then((module) => module.default);
const statsRoutes = await import('./routes/stats.js').then((module) => module.default);

function callRoute(router, method, path, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      url: path,
      originalUrl: path,
      baseUrl: '',
      path,
      query: {},
      params: {},
      body,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    };
    const queryIndex = path.indexOf('?');
    if (queryIndex !== -1) {
      req.url = path.slice(0, queryIndex);
      req.path = req.url;
      req.query = Object.fromEntries(new URLSearchParams(path.slice(queryIndex + 1)));
    }

    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: this.statusCode, body: payload });
        return this;
      },
      send(payload) {
        resolve({ status: this.statusCode, body: payload });
        return this;
      },
      setHeader() {},
      getHeader() {},
      end(payload) {
        resolve({ status: this.statusCode, body: payload });
      },
    };

    router.handle(req, res, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve({ status: 404, body: { error: 'Not found' } });
      }
    });
  });
}

async function registerUser(email = 'student@nextsprint.dev') {
  const response = await callRoute(authRoutes, 'POST', '/register', {
    body: { name: 'Test Student', email, password: 'password123' },
  });

  expect(response.status).toBe(201);
  return response.body;
}

beforeEach(() => {
  resetStore();
});

describe('NextSprint API integration with mocked database calls', () => {
  it('protects authenticated resources', async () => {
    const response = await callRoute(projectRoutes, 'GET', '/');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('No token provided');
  });

  it('supports the frontend register, profile, project, task, and stats flow', async () => {
    const { token, user } = await registerUser();
    expect(token).toEqual(expect.any(String));
    expect(user).toMatchObject({
      id: 1,
      name: 'Test Student',
      email: 'student@nextsprint.dev',
      currentModule: 1,
      resumeStatus: 'not-started',
    });
    expect(user).not.toHaveProperty('password_hash');

    const profileResponse = await callRoute(userRoutes, 'PUT', '/me', {
      token,
      body: {
        name: 'Updated Student',
        currentModule: 3,
        github: 'https://github.com/test-student',
        portfolio: 'https://student.dev',
        resumeStatus: 'in-progress',
      },
    });
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.user).toMatchObject({
      name: 'Updated Student',
      currentModule: 3,
      github: 'https://github.com/test-student',
      portfolio: 'https://student.dev',
      resumeStatus: 'in-progress',
    });

    const projectResponse = await callRoute(projectRoutes, 'POST', '/', {
      token,
      body: { title: 'Capstone', description: 'Bootcamp final project' },
    });
    expect(projectResponse.status).toBe(201);
    expect(projectResponse.body.project).toMatchObject({
      id: 1,
      title: 'Capstone',
      description: 'Bootcamp final project',
      taskCount: 0,
    });

    const taskResponse = await callRoute(taskRoutes, 'POST', '/', {
      token,
      body: {
        title: 'Build auth screens',
        description: 'Login and register integration',
        status: 'todo',
        priority: 'high',
        category: 'coursework',
        dueDate: '2026-06-11',
        projectId: projectResponse.body.project.id,
      },
    });
    expect(taskResponse.status).toBe(201);
    expect(taskResponse.body.task).toMatchObject({
      id: 1,
      title: 'Build auth screens',
      status: 'todo',
      priority: 'high',
      category: 'coursework',
      dueDate: '2026-06-11',
      projectId: projectResponse.body.project.id,
      completedAt: null,
    });

    const projectsResponse = await callRoute(projectRoutes, 'GET', '/', { token });
    expect(projectsResponse.status).toBe(200);
    expect(projectsResponse.body.projects).toHaveLength(1);
    expect(projectsResponse.body.projects[0]).toMatchObject({ title: 'Capstone', taskCount: 1 });

    const completeResponse = await callRoute(taskRoutes, 'PUT', `/${taskResponse.body.task.id}`, {
      token,
      body: { status: 'complete' },
    });
    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.task.status).toBe('complete');
    expect(completeResponse.body.task.completedAt).toEqual(expect.any(String));

    const statsResponse = await callRoute(statsRoutes, 'GET', '/', { token });
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body).toMatchObject({
      tasksCompleted: 1,
      tasksRemaining: 0,
      projectsActive: 1,
      weeklyCompleted: 1,
      currentModule: 3,
    });
  });

  it('keeps projects and tasks isolated by authenticated user', async () => {
    const firstUser = await registerUser('first@nextsprint.dev');
    const secondUser = await registerUser('second@nextsprint.dev');

    const projectResponse = await callRoute(projectRoutes, 'POST', '/', {
      token: firstUser.token,
      body: { title: 'Private Project' },
    });
    expect(projectResponse.status).toBe(201);

    const taskResponse = await callRoute(taskRoutes, 'POST', '/', {
      token: firstUser.token,
      body: { title: 'Private Task', projectId: projectResponse.body.project.id },
    });
    expect(taskResponse.status).toBe(201);

    const otherProjectsResponse = await callRoute(projectRoutes, 'GET', '/', {
      token: secondUser.token,
    });
    expect(otherProjectsResponse.status).toBe(200);
    expect(otherProjectsResponse.body.projects).toEqual([]);

    const crossUserTaskResponse = await callRoute(taskRoutes, 'POST', '/', {
      token: secondUser.token,
      body: { title: 'Attach to someone else', projectId: projectResponse.body.project.id },
    });
    expect(crossUserTaskResponse.status).toBe(400);
    expect(crossUserTaskResponse.body.error).toBe('Project not found');

    const otherTasksResponse = await callRoute(taskRoutes, 'GET', '/', {
      token: secondUser.token,
    });
    expect(otherTasksResponse.status).toBe(200);
    expect(otherTasksResponse.body.tasks).toEqual([]);
  });
});
