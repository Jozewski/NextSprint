import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';

export function renderApp(route = '/') {
  window.history.pushState({}, 'Test page', route);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}
