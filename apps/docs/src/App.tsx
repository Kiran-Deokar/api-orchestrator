import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  HomePage,
  IntroductionPage,
  InstallationPage,
  QuickStartPage,
  ClientPage,
  HttpMethodsPage,
  ParamsPage,
  HeadersPage,
  ContentTypesPage,
  AuthenticationPage,
  ErrorsPage,
  StatusHandlersPage,
  CancellationPage,
  TimeoutsPage,
  RetriesPage,
  UploadsPage,
  LoggingPage,
  MiddlewarePage,
  ReactPage,
  TypeScriptPage,
  JavaScriptPage,
  SecurityPage,
  ApiReferencePage,
  TroubleshootingPage,
  ChangelogPage,
} from './content';

const nav = [
  {
    section: 'Getting Started',
    items: [
      { to: '/', label: 'Home' },
      { to: '/introduction', label: 'Introduction' },
      { to: '/installation', label: 'Installation' },
      { to: '/quick-start', label: 'Quick Start' },
    ],
  },
  {
    section: 'Core Client',
    items: [
      { to: '/client', label: 'Creating a Client' },
      { to: '/http-methods', label: 'HTTP Methods' },
      { to: '/params', label: 'Query Params & URLs' },
      { to: '/headers', label: 'Headers' },
      { to: '/content-types', label: 'Content Types' },
      { to: '/authentication', label: 'Authentication' },
    ],
  },
  {
    section: 'Reliability',
    items: [
      { to: '/errors', label: 'Error Handling' },
      { to: '/status-handlers', label: 'Status Handlers' },
      { to: '/cancellation', label: 'Cancellation' },
      { to: '/timeouts', label: 'Timeouts' },
      { to: '/retries', label: 'Retries' },
    ],
  },
  {
    section: 'Features',
    items: [
      { to: '/uploads', label: 'File Uploads' },
      { to: '/logging', label: 'Logging' },
      { to: '/middleware', label: 'Middleware & Events' },
    ],
  },
  {
    section: 'Platforms',
    items: [
      { to: '/react', label: 'React Integration' },
      { to: '/typescript', label: 'TypeScript' },
      { to: '/javascript', label: 'JavaScript' },
    ],
  },
  {
    section: 'Reference',
    items: [
      { to: '/api-reference', label: 'API Reference' },
      { to: '/security', label: 'Security' },
      { to: '/troubleshooting', label: 'Troubleshooting' },
      { to: '/changelog', label: 'Changelog' },
    ],
  },
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="layout">
      <button
        type="button"
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle navigation"
      >
        Menu
      </button>

      <aside className={'sidebar' + (sidebarOpen ? ' open' : '')}>
        <h1>api-orchestrator</h1>
        <p className="tagline">v1.0.0 · Docs</p>
        <nav>
          {nav.map((group) => (
            <React.Fragment key={group.section}>
              <div className="section">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {item.label}
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/introduction" element={<IntroductionPage />} />
          <Route path="/installation" element={<InstallationPage />} />
          <Route path="/quick-start" element={<QuickStartPage />} />
          <Route path="/client" element={<ClientPage />} />
          <Route path="/http-methods" element={<HttpMethodsPage />} />
          <Route path="/params" element={<ParamsPage />} />
          <Route path="/headers" element={<HeadersPage />} />
          <Route path="/content-types" element={<ContentTypesPage />} />
          <Route path="/authentication" element={<AuthenticationPage />} />
          <Route path="/errors" element={<ErrorsPage />} />
          <Route path="/status-handlers" element={<StatusHandlersPage />} />
          <Route path="/cancellation" element={<CancellationPage />} />
          <Route path="/timeouts" element={<TimeoutsPage />} />
          <Route path="/retries" element={<RetriesPage />} />
          <Route path="/uploads" element={<UploadsPage />} />
          <Route path="/logging" element={<LoggingPage />} />
          <Route path="/middleware" element={<MiddlewarePage />} />
          <Route path="/react" element={<ReactPage />} />
          <Route path="/typescript" element={<TypeScriptPage />} />
          <Route path="/javascript" element={<JavaScriptPage />} />
          <Route path="/api-reference" element={<ApiReferencePage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/troubleshooting" element={<TroubleshootingPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route
            path="*"
            element={
              <div>
                <h1>404</h1>
                <p>Page not found. Use the sidebar to navigate.</p>
              </div>
            }
          />
        </Routes>
      </main>

      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title="Toggle theme"
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </div>
  );
}
