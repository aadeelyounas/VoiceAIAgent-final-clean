import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export function InboundAgent() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfig = async () => {
    setStatus({ type: 'success', message: 'Fetching current configuration...' });
    try {
      const response = await fetch('http://voiceaiagent.tech:5002/config');
      if (response.ok) {
        const config = await response.json();
        setGreeting(config.greeting);
        setPrompt(config.think_prompt);
        setModel(config.think_model);
        setStatus({ type: 'success', message: 'Configuration loaded successfully' });
      } else {
        const errorText = await response.text();
        setStatus({
          type: 'error',
          message: `Failed to fetch config: ${response.status} ${response.statusText} - ${errorText}`
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus({
        type: 'error',
        message: `An error occurred while fetching configuration: ${message}`
      });
    }
  };

  const updateConfig = async (configType: string) => {
    let value = '';
    if (configType === 'greeting') value = greeting;
    else if (configType === 'prompt') value = prompt;
    else if (configType === 'model') value = model;

    if (!value) {
      setStatus({
        type: 'error',
        message: `${configType.charAt(0).toUpperCase() + configType.slice(1)} cannot be empty`
      });
      return;
    }

    setStatus({ type: 'success', message: `Updating ${configType}...` });
    try {
      const response = await fetch(`http://voiceaiagent.tech:5002/config/${configType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value })
      });

      if (response.ok) {
        setStatus({
          type: 'success',
          message: `${configType.charAt(0).toUpperCase() + configType.slice(1)} updated successfully`
        });
      } else {
        const errorText = await response.text();
        setStatus({
          type: 'error',
          message: `Failed to update ${configType}: ${response.status} ${response.statusText} - ${errorText}`
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus({
        type: 'error',
        message: `An error occurred while updating ${configType}: ${message}`
      });
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // sidebar open/closed (persist in localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('sidebarOpen') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen">
      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside
        id="sidebar"
        className={`
          bg-white shadow-lg transition-all duration-300 ease-in-out
          flex flex-col justify-between
          ${isSidebarOpen ? 'w-64' : 'w-[4.5rem]'}
        `}
      >
        <div>
          <div
            className="flex items-center justify-center py-6 px-2 border-b border-gray-200 cursor-pointer"
            onClick={toggleSidebar}
          >
            <img
              alt="VoiceAIAgent"
              className="h-8 w-auto"
              src="/logo.png"
            />
          </div>
          <nav className="mt-6">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">apps</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Agents</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">history</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>History</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">dialpad</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Numbers</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">storage</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>KBs</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">receipt_long</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Batches</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">mic</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Voices</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">code</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>API Keys</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">cloud_queue</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Providers</span>
            </a>
          </nav>
        </div>

        <div className="py-6 px-4 border-t border-gray-200">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="menu-item flex items-center hover:bg-gray-100 hover:text-gray-700 py-2 px-2 rounded-lg"
          >
            <span className="material-icons sidebar-icon">account_circle</span>
            <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Profile</span>
          </a>
          <button
            onClick={handleLogout}
            className="menu-item flex items-center hover:bg-gray-100 hover:text-gray-700 py-2 px-2 rounded-lg w-full text-left"
          >
            <span className="material-icons sidebar-icon">logout</span>
            <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────────── */}
      <main
        id="main-content"
        className={`
          flex-1 p-6 transition-all duration-300 ease-in-out bg-white
          ${isSidebarOpen ? 'ml-64' : 'ml-[4.5rem]'}
        `}
      >
        {/* ── Header ────────────────────────────────────────────────────────────── */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Inbound Agent Configuration</h1>
        </header>

        {/* Configuration Form */}
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="greeting">
              Greeting:
            </label>
            <input
              id="greeting"
              type="text"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter greeting message"
            />
            <button
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={() => updateConfig('greeting')}
            >
              Update Greeting
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="prompt">
              Prompt:
            </label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter agent prompt"
            />
            <button
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={() => updateConfig('prompt')}
            >
              Update Prompt
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="model">
              Model:
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter model name"
            />
            <button
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={() => updateConfig('model')}
            >
              Update Model
            </button>
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={`mt-4 p-3 rounded ${
                status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}