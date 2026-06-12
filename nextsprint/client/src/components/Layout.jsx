// App shell: sidebar + content area. Developer 4 owns the polish pass here.
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/board', label: 'Board' },
  { to: '/projects', label: 'Projects' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-56 flex-col bg-indigo-700 text-indigo-100">
        <div className="px-5 py-6">
          <span className="text-lg font-bold text-white">
            Next<span className="text-orange-400">Sprint</span>
          </span>
          <p className="mt-1 text-xs text-indigo-300">Sprint toward your <span className="text-orange-300 font-medium">Next Chapter</span></p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-900 text-white'
                    : 'hover:bg-indigo-600 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-indigo-600 px-5 py-4">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-indigo-300">Module {user?.currentModule}</p>
          <button
            onClick={logout}
            className="mt-3 text-xs font-medium text-indigo-300 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
