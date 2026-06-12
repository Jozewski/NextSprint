// Development/demo data.
// Run with: npm run seed
// Login afterwards using the passwordless OTP email flow.
import 'dotenv/config';
import db from './db.js';

const passwordHash = 'otp_passwordless_account';

const users = [
  { name: 'Jacqueline Delgado', email: 'actonitwithhelp@live.com' },
  { name: 'Diana Busch', email: 'buschdiana007@gmail.com' },
  { name: 'Darla Brown', email: 'darlanebrown@gmail.com' },
  { name: 'Destiny Mills', email: 'dhmills292@gmail.com' },
  { name: 'Penn Cameron P.', email: 'fundlush1@gmail.com' },
  { name: 'Joanne Liszewski', email: 'joanneliszewski@gmail.com' },
  { name: 'Jordan Walsh', email: 'jwalb90@gmail.com' },
  { name: 'Kit Tensfeldt', email: 'kit.f.tensfeldt@gmail.com' },
  { name: 'Michael Peacock', email: 'michaellynnpeacock@gmail.com' },
  { name: 'Phillip Anthony', email: 'phillip1.anthony3@gmail.com' },
  { name: 'Summer Halsey', email: 'summer.halsey0318@gmail.com' },
];
const projectTemplates = [
  {
    title: 'Weeks 1-3 Phase 1 Foundations',
    description: 'Think with AI coursework: orientation, prompting, HTML/CSS, JavaScript, debugging, and the Phase 1 gate.',
  },
  {
    title: 'Weeks 4-5 Phase 2 Data and React',
    description: 'Build with AI coursework covering design thinking, APIs, databases, SQL, Node.js, React, and React API work.',
  },
  {
    title: 'Week 6 Next.js and Persistence',
    description: 'Next.js, Postgres, Prisma, API routes, READ/CREATE work, shared repo practice, and git flow.',
  },
  {
    title: 'Week 7 TDD and AI Build',
    description: 'Current Week 7 coursework through Day 5: TDD, CLI workflows, APIs, OpenAI, and team build.',
  },
];

const taskTemplates = [
  [
    {
      title: 'Week 1 Day 1: Orientation + What Is AI?',
      description: 'Confirm Phase 1 orientation and Understanding AI evidence are recorded.',
      status: 'complete',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -34,
    },
    {
      title: 'Week 1 Day 2: Prompting fundamentals',
      description: 'Review prompting fundamentals and reading AI output evidence.',
      status: 'complete',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -33,
    },
    {
      title: 'Week 2 Day 1: HTML + CSS styled page',
      description: 'Validate distinguished HTML/CSS evidence from the styled page build.',
      status: 'complete',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -29,
    },
    {
      title: 'Week 2 Day 4: JavaScript fundamentals',
      description: 'Reinforce variables, functions, loops, arrays, and objects for proficient evidence.',
      status: 'review',
      priority: 'high',
      category: 'coursework',
      dueOffset: -26,
    },
    {
      title: 'Week 3 Day 4: Phase 1 competency gate',
      description: 'Archive Human Judgment, Code Reading, Code Modification, and Debugging evidence.',
      status: 'complete',
      priority: 'high',
      category: 'coursework',
      dueOffset: -18,
    },
    {
      title: 'Follow up: Understanding AI concepts',
      description: 'Add review notes for the developing Understanding AI competency.',
      status: 'todo',
      priority: 'medium',
      category: 'coursework',
      dueOffset: 2,
    },
  ],
  [
    {
      title: 'Week 4 Day 1: Design Thinking Workshop',
      description: 'Capture the 100% scored Design Thinking result in coursework notes.',
      status: 'complete',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -14,
    },
    {
      title: 'Week 4 Day 2: What is an API?',
      description: 'Connect API Fundamentals evidence to request and response vocabulary.',
      status: 'complete',
      priority: 'high',
      category: 'coursework',
      dueOffset: -13,
    },
    {
      title: 'Week 4 Day 4: SQL basics',
      description: 'Review SQL basics and database concepts that are still developing.',
      status: 'review',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -11,
    },
    {
      title: 'Week 5 Day 1: Node.js basics',
      description: 'Revisit how JavaScript leaves the browser and handles server logic.',
      status: 'complete',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -9,
    },
    {
      title: 'Week 5 Day 2-3: React fundamentals',
      description: 'Review components, events, lists, and conditional rendering evidence.',
      status: 'complete',
      priority: 'high',
      category: 'coursework',
      dueOffset: -7,
    },
    {
      title: 'Week 5 Day 4: React + APIs',
      description: 'Practice API integration flow with loading, success, and error states.',
      status: 'in-progress',
      priority: 'high',
      category: 'coursework',
      dueOffset: 1,
    },
    {
      title: 'Follow up: Async JavaScript',
      description: 'Queue focused practice for promises, async/await, and fetch.',
      status: 'backlog',
      priority: 'high',
      category: 'coursework',
      dueOffset: 4,
    },
  ],
  [
    {
      title: 'Week 6 Day 1: Next.js intro',
      description: 'Revisit React plus a server and connect it to Next.js Fundamentals evidence.',
      status: 'complete',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -5,
    },
    {
      title: 'Week 6 Day 2: Connect to Postgres + Prisma',
      description: 'Practice database connection, Prisma setup, and ORM usage concepts.',
      status: 'in-progress',
      priority: 'high',
      dueOffset: 1,
      category: 'coursework',
    },
    {
      title: 'Week 6 Day 3: API Routes READ + CREATE',
      description: 'Map route handlers to read/create actions and API route responsibilities.',
      status: 'complete',
      priority: 'high',
      category: 'coursework',
      dueOffset: -3,
    },
    {
      title: 'Week 6 Day 4: Shared repo + git flow',
      description: 'Review branch workflow, pull request habits, and team build coordination.',
      status: 'complete',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -2,
    },
    {
      title: 'Follow up: CRUD operations',
      description: 'Strengthen developing CRUD evidence before Week 7 UPDATE/DELETE work.',
      status: 'todo',
      priority: 'high',
      category: 'coursework',
      dueOffset: 2,
    },
    {
      title: 'Follow up: Database concepts and ORM usage',
      description: 'Compare schema design, raw SQL, Prisma models, and query responsibilities.',
      status: 'review',
      priority: 'medium',
      category: 'coursework',
      dueOffset: 4,
    },
  ],
  [
    {
      title: 'Week 7 Day 1: TDD + AI',
      description: 'Complete Test-Driven Development with an AI pair coursework.',
      status: 'complete',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -4,
    },
    {
      title: 'Week 7 Day 2: CLI sessions and UPDATE/DELETE',
      description: 'Finish applied CLI session practice and CRUD update/delete exercises.',
      status: 'complete',
      priority: 'medium',
      category: 'coursework',
      dueOffset: -3,
    },
    {
      title: 'Week 7 Day 3: Third-party APIs and OpenAI API',
      description: 'Complete API practice using external services and the OpenAI API.',
      status: 'complete',
      priority: 'high',
      category: 'coursework',
      dueOffset: -2,
    },
    {
      title: 'Week 7 Day 4: TDD team build Day 1',
      description: 'Test-harden a shared app with the team and record passing coverage.',
      status: 'complete',
      priority: 'high',
      category: 'coursework',
      dueOffset: -1,
    },
    {
      title: 'Week 7 Day 5: Vibe Code Friday',
      description: 'Continue TDD team build Day 2 and capture final notes for Week 7.',
      status: 'in-progress',
      priority: 'high',
      category: 'coursework',
      dueOffset: 0,
    },
    {
      title: 'Add testing and documentation evidence',
      description: 'Create follow-up evidence for emerging Testing Fundamentals and Documentation.',
      status: 'todo',
      priority: 'medium',
      category: 'coursework',
      dueOffset: 3,
    },
    {
      title: 'Practice CLI session discipline',
      description: 'Document a clean CLI workflow from prompt to verification.',
      status: 'backlog',
      priority: 'medium',
      category: 'coursework',
      dueOffset: 5,
    },
  ],
];

const userProgressOverrides = [
  {
    'Week 7 Day 5: Vibe Code Friday': 'in-progress',
    'Add testing and documentation evidence': 'todo',
    'Follow up: Async JavaScript': 'backlog',
  },
  {
    'Week 5 Day 4: React + APIs': 'complete',
    'Week 6 Day 2: Connect to Postgres + Prisma': 'review',
    'Follow up: CRUD operations': 'in-progress',
    'Week 7 Day 5: Vibe Code Friday': 'review',
  },
  {
    'Week 2 Day 4: JavaScript fundamentals': 'complete',
    'Follow up: Understanding AI concepts': 'in-progress',
    'Week 6 Day 2: Connect to Postgres + Prisma': 'todo',
    'Week 7 Day 5: Vibe Code Friday': 'in-progress',
    'Practice CLI session discipline': 'todo',
  },
  {
    'Week 4 Day 4: SQL basics': 'complete',
    'Week 5 Day 4: React + APIs': 'review',
    'Follow up: Database concepts and ORM usage': 'in-progress',
    'Week 7 Day 5: Vibe Code Friday': 'todo',
  },
  {
    'Follow up: Understanding AI concepts': 'complete',
    'Follow up: Async JavaScript': 'todo',
    'Week 6 Day 2: Connect to Postgres + Prisma': 'complete',
    'Week 7 Day 5: Vibe Code Friday': 'complete',
  },
  {
    'Week 5 Day 4: React + APIs': 'todo',
    'Follow up: CRUD operations': 'backlog',
    'Week 7 Day 5: Vibe Code Friday': 'in-progress',
    'Add testing and documentation evidence': 'in-progress',
  },
  {
    'Week 2 Day 4: JavaScript fundamentals': 'review',
    'Week 4 Day 4: SQL basics': 'in-progress',
    'Week 6 Day 2: Connect to Postgres + Prisma': 'backlog',
    'Week 7 Day 5: Vibe Code Friday': 'todo',
  },
  {
    'Follow up: Understanding AI concepts': 'review',
    'Week 5 Day 4: React + APIs': 'complete',
    'Follow up: Async JavaScript': 'in-progress',
    'Week 7 Day 5: Vibe Code Friday': 'review',
    'Practice CLI session discipline': 'in-progress',
  },
  {
    'Week 4 Day 4: SQL basics': 'todo',
    'Week 6 Day 2: Connect to Postgres + Prisma': 'in-progress',
    'Follow up: Database concepts and ORM usage': 'todo',
    'Week 7 Day 5: Vibe Code Friday': 'in-progress',
  },
  {
    'Week 2 Day 4: JavaScript fundamentals': 'complete',
    'Follow up: CRUD operations': 'complete',
    'Week 7 Day 5: Vibe Code Friday': 'complete',
    'Add testing and documentation evidence': 'review',
  },
  {
    'Follow up: Understanding AI concepts': 'backlog',
    'Week 5 Day 4: React + APIs': 'in-progress',
    'Week 6 Day 2: Connect to Postgres + Prisma': 'review',
    'Week 7 Day 5: Vibe Code Friday': 'in-progress',
  },
];

function dateFromOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function statusForTask(task, userIndex) {
  return userProgressOverrides[userIndex]?.[task.title] || task.status;
}

function completedAtFor(userIndex, projectIndex, taskIndex) {
  const date = new Date();
  date.setDate(date.getDate() - ((userIndex + projectIndex + taskIndex) % 6));
  return date.toISOString();
}

const deleteUser = db.prepare('DELETE FROM users WHERE email = ?');
const insertUser = db.prepare(`
  INSERT INTO users (name, email, password_hash, current_module, github, portfolio, resume_status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertProject = db.prepare('INSERT INTO projects (title, description, owner_id) VALUES (?, ?, ?)');
const insertTask = db.prepare(`
  INSERT INTO tasks (title, description, status, priority, category, due_date, project_id, owner_id, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

try {
  db.exec('BEGIN');

  for (const email of users.map((user) => user.email)) {
    deleteUser.run(email);
  }

  users.forEach((user, userIndex) => {
    const userResult = insertUser.run(
      user.name,
      user.email,
      passwordHash,
      7,
      '',
      '',
      'not-started'
    );
    const userId = userResult.lastInsertRowid;

    projectTemplates.forEach((project, projectIndex) => {
      const projectId = insertProject.run(project.title, project.description, userId).lastInsertRowid;

      taskTemplates[projectIndex].forEach((task, taskIndex) => {
        const status = statusForTask(task, userIndex);
        const completedAt = status === 'complete' ? completedAtFor(userIndex, projectIndex, taskIndex) : null;

        insertTask.run(
          task.title,
          task.description,
          status,
          task.priority,
          task.category,
          dateFromOffset(task.dueOffset + (userIndex % 3)),
          projectId,
          userId,
          completedAt
        );
      });
    });
  });

  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  throw error;
}

const taskCount = taskTemplates.reduce((total, projectTasks) => total + projectTasks.length, 0);
console.log(`Seeded ${users.length} users, ${users.length * projectTemplates.length} projects, and ${users.length * taskCount} tasks.`);
console.log(`Login with any seeded email using the OTP flow (check server logs/console for code).`);
