import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Chat } from '../components/Chat';

interface Agent {
  agent_id: string;
  data: {
    agent_name: string;
    agent_welcome_message: string;
    assistant_status?: string;
    tasks: Array<{
      task_type: string;
      toolchain: {
        execution: string;
        pipelines: string[][];
      };
      tools_config: {
        input?: { format: string; provider: string };
        llm_agent: {
          agent_type: string;
          agent_flow_type: string;
          routes: any;
          llm_config: { 
            provider: string;
            model: string;
            request_json: boolean;
          };
        };
        output?: { format: string; provider: string };
        synthesizer: {
          provider: string;
          audio_format: string;
          stream: boolean;
          provider_config: { 
            voice: string;
            model: string;
          };
          buffer_size: number;
        };
        transcriber: {
          provider: string;
          encoding: string;
          language: string;
          stream: boolean;
        };
      };
      task_config: {
        hangup_after_silence: number;
      };
    }>;
  };
}

interface CurrentAgentState {
  agent_id: string;
  agent_name: string;
  system_prompt: string;
  welcome_message: string;
  model: string;
  voice: string;
  voiceProvider: 'deepgram' | 'elevenlabs';
  voiceId?: string; // For ElevenLabs voices
  elevenLabsModel?: string; // For ElevenLabs model selection
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: {
    accent?: string;
    description?: string;
    descriptive?: string;
    age?: string;
    gender?: string;
    use_case?: string;
  };
  description?: string;
  preview_url?: string;
}

export function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // ── Constants ─────────────────────────────────────────────────────────────────
  const DEEPGRAM_VOICES = [
    { value: 'andromeda', label: 'Andromeda (feminine, Adult, American)' },
    { value: 'apollo', label: 'Apollo (masculine, Adult, American)' },
    { value: 'arcas', label: 'Arcas (masculine, Adult, American)' },
    { value: 'aries', label: 'Aries (masculine, Adult, American)' },
    { value: 'asteria', label: 'Asteria (feminine, Adult, American)' },
    { value: 'athena', label: 'Athena (feminine, Mature, American)' },
    { value: 'draco', label: 'Draco (masculine, Adult, British)' },
    { value: 'pandora', label: 'Pandora (feminine, Adult, British)' },
    { value: 'phoebe', label: 'Phoebe (feminine, Adult, American)' },
    { value: 'pluto', label: 'Pluto (masculine, Adult, American)' }
  ];

  const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
    {
      voice_id: "21m00Tcm4TlvDq8ikWAM",
      name: "Rachel",
      category: "premade",
      labels: {
        accent: "american",
        description: "calm",
        age: "young",
        gender: "female",
        use_case: "narration"
      },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/b4928a68-c03b-411f-8533-3d5c299fd451.mp3"
    },
    {
      voice_id: "29vD33N1CtxCmqQRPOHJ",
      name: "Drew",
      category: "premade",
      labels: {
        accent: "american",
        description: "well-rounded",
        age: "middle_aged",
        gender: "male",
        use_case: "news"
      },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/29vD33N1CtxCmqQRPOHJ/b99fc51d-12d3-4312-b480-a8a45a7d51ef.mp3"
    },
    {
      voice_id: "2EiwWnXFnvU5JabPnv8n",
      name: "Clyde",
      category: "premade",
      labels: {
        accent: "american",
        description: "war veteran",
        age: "middle_aged",
        gender: "male",
        use_case: "characters"
      },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/2EiwWnXFnvU5JabPnv8n/65d80f52-703f-4cae-a91d-75d4e200ed02.mp3"
    },
    {
      voice_id: "5Q0t7uMcjvnagumLfvZi",
      name: "Paul",
      category: "premade",
      labels: {
        accent: "american",
        description: "authoritative",
        age: "middle_aged",
        gender: "male",
        use_case: "news"
      },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/5Q0t7uMcjvnagumLfvZi/a4aaa30e-54c4-44a4-8e46-b9b00505d963.mp3"
    },
    {
      voice_id: "9BWtsMINqrJLrRacOk9x",
      name: "Aria",
      category: "premade",
      labels: {
        accent: "american",
        descriptive: "husky",
        age: "middle_aged",
        gender: "female",
        use_case: "informative_educational"
      },
      description: "A middle-aged female with an African-American accent. Calm with a hint of rasp.",
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/9BWtsMINqrJLrRacOk9x/405766b8-1f4e-4d3c-aba1-6f25333823ec.mp3"
    },
    {
      voice_id: "AZnzlk1XvdvUeBnXmlld",
      name: "Domi",
      category: "premade",
      labels: {
        accent: "american",
        description: "strong",
        age: "young",
        gender: "female",
        use_case: "narration"
      },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/b3c36b01-f80d-4b16-a698-f83682dee84c.mp3"
    },
    {
      voice_id: "CYw3kZ02Hs0563khs1Fj",
      name: "Dave",
      category: "premade",
      labels: {
        accent: "british",
        description: "conversational",
        age: "young",
        gender: "male",
        use_case: "characters"
      },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/CYw3kZ02Hs0563khs1Fj/872cb056-45d3-419e-b5c6-de2b387a93a0.mp3"
    },
    {
      voice_id: "CwhRBWXzGAHq8TQ4Fs17",
      name: "Roger",
      category: "premade",
      labels: {
        accent: "",
        description: "confident",
        age: "middle_aged",
        gender: "male",
        use_case: "social_media"
      },
      description: "",
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/CwhRBWXzGAHq8TQ4Fs17/58ee3ff5-f6f2-4628-93b8-e38eb31806b0.mp3"
    },
    {
      voice_id: "D38z5RcWu1voky8WS1ja",
      name: "Fin",
      category: "premade",
      labels: {
        accent: "irish",
        description: "sailor",
        age: "old",
        gender: "male",
        use_case: "characters"
      },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/D38z5RcWu1voky8WS1ja/a470ba64-1e72-46d9-ba9d-030c4155e2d2.mp3"
    },
    {
      voice_id: "EXAVITQu4vr4xnSDxMaL",
      name: "Sarah",
      category: "premade",
      labels: {
        accent: "american",
        descriptive: "professional",
        age: "young",
        gender: "female",
        use_case: "entertainment_tv"
      },
      description: "Young adult woman with a confident and warm, mature quality and a reassuring, professional tone.",
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/01a3e33c-6e99-4ee7-8543-ff2216a32186.mp3"
    }
  ];

  // ── State ─────────────────────────────────────────────────────────────────────
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<CurrentAgentState | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [callStatus, setCallStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatAgentId, setChatAgentId] = useState<string>('');
  const [selectedElevenLabsVoice, setSelectedElevenLabsVoice] = useState<ElevenLabsVoice | null>(null);

  // sidebar open/closed (persist in localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('sidebarOpen') === 'true';
  });

  // 0=Agent,1=LLM,2=Voice,3=Inbound
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', isSidebarOpen.toString());
  }, [isSidebarOpen]);

  // ── Helper function for default agent state ─────────────────────────────────
  const getDefaultAgentState = (): CurrentAgentState => ({
    agent_id: '',
    agent_name: '',
    system_prompt: '',
    welcome_message: '',
    model: 'gpt-4-turbo',
    voice: 'thalia',
    voiceProvider: 'deepgram',
    elevenLabsModel: 'eleven_turbo_v2_5',
  });

  // ── Data Fetching & Handlers ───────────────────────────────────────────────────
  const fetchAgents = async () => {
    try {
      const response = await fetch(`http://voiceaiagent.tech:5001/all`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setStatus({ type: 'error', message: 'Failed to load agents' });
    }
  };

  const loadAgentForEdit = async (agentId: string) => {
    try {
      const response = await fetch(`http://voiceaiagent.tech:5001/agent/${agentId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const agentData = await response.json();

      // fetch system prompt JSON from the agent data API endpoint
      let systemPrompt = '';
      try {
        const promptResp = await fetch(`http://voiceaiagent.tech:5001/agent/${agentId}/prompts`);
        if (promptResp.ok) {
          const promptData = await promptResp.json();
          systemPrompt = promptData.task_1?.system_prompt || '';
        }
      } catch (err) {
        console.error('Error fetching system prompt:', err);
        // Fallback: try to extract from agent data if available
        systemPrompt = '';
      }

      const synthesizerProvider = agentData.tasks?.[0]?.tools_config?.synthesizer?.provider || 'deepgram';
      const voiceConfig = agentData.tasks?.[0]?.tools_config?.synthesizer?.provider_config;
      
      setCurrentAgent({
        agent_id: agentId,
        agent_name: agentData.agent_name,
        system_prompt: systemPrompt,
        welcome_message: agentData.agent_welcome_message || '',
        model: agentData.tasks?.[0]?.tools_config?.llm_agent?.llm_config?.model || 'gpt-4-turbo',
        voice: voiceConfig?.voice || 'thalia',
        voiceProvider: synthesizerProvider === 'elevenlabs' ? 'elevenlabs' : 'deepgram',
        voiceId: voiceConfig?.voice_id,
        elevenLabsModel: voiceConfig?.model || 'eleven_turbo_v2_5',
      });
      
      // Set selected ElevenLabs voice for preview if applicable
      if (synthesizerProvider === 'elevenlabs' && voiceConfig?.voice) {
        const selectedVoice = ELEVENLABS_VOICES.find(v => v.name === voiceConfig.voice);
        setSelectedElevenLabsVoice(selectedVoice || null);
      }
      setIsEditing(true);
      setActiveTabIndex(0);
      setStatus(null);
    } catch (err) {
      console.error('Error loading agent:', err);
      setStatus({ type: 'error', message: `Error loading agent: ${err instanceof Error ? err.message : 'Unknown error'}` });
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    try {
      const res = await fetch(`http://voiceaiagent.tech:5001/agent/${agentId}`, { method: 'DELETE' });
      
      if (res.ok) {
        const data = await res.json();
        setStatus({ 
          type: 'success', 
          message: `Agent deleted successfully (${data.state})` 
        });
        fetchAgents();
        if (currentAgent?.agent_id === agentId) resetForm();
      } else if (res.status === 404) {
        setStatus({ 
          type: 'error', 
          message: 'Agent not found - it may have already been deleted' 
        });
        // Still refresh the list in case it was showing stale data
        fetchAgents();
        if (currentAgent?.agent_id === agentId) resetForm();
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Failed to delete agent');
      }
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to delete agent' });
    }
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgent) return;

    const isEdit = !!currentAgent.agent_id;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `http://voiceaiagent.tech:5001/agent/${currentAgent.agent_id}` : `http://voiceaiagent.tech:5001/agent`;

    // Build synthesizer config based on provider
    const synthesizerConfig = currentAgent.voiceProvider === 'elevenlabs' 
      ? {
          provider: 'elevenlabs',
          audio_format: 'wav',
          stream: true,
          provider_config: {
            voice: currentAgent.voice,
            model: currentAgent.elevenLabsModel || 'eleven_turbo_v2_5',
            voice_id: currentAgent.voiceId || 'aMSt68OGf4xUZAnLpTU8'
          },
          buffer_size: 100,
        }
      : {
          provider: 'deepgram',
          audio_format: 'linear16',
          stream: true,
          provider_config: {
            voice: currentAgent.voice,
            model: `aura-2-${currentAgent.voice}-en`,
            voice_id: currentAgent.voice  // Add missing voice_id for Deepgram
          },
          buffer_size: 100,
        };

    // Adjust input/output format based on voice provider
    const audioFormat = currentAgent.voiceProvider === 'elevenlabs' ? 'wav' : 'linear16';

    const payload = {
      agent_config: {
        agent_name: currentAgent.agent_name,
        agent_type: 'other',
        agent_welcome_message: currentAgent.welcome_message,
        tasks: [
          {
            task_type: 'conversation',
            toolchain: { 
              execution: 'parallel', 
              pipelines: [['transcriber', 'llm', 'synthesizer']] 
            },
            tools_config: {
              input: { format: audioFormat, provider: 'twilio' },
              llm_agent: {
                agent_type: 'simple_llm_agent',
                agent_flow_type: 'streaming',
                routes: null,
                llm_config: {
                  agent_flow_type: 'streaming',
                  provider: currentAgent.model === 'deepseek-chat' ? 'deepseek' : 'openai',
                  model: currentAgent.model,
                  request_json: true,
                },
              },
              output: { format: audioFormat, provider: 'twilio' },
              synthesizer: synthesizerConfig,
              transcriber: { 
                provider: 'deepgram', 
                encoding: 'linear16', 
                language: 'en', 
                stream: true 
              },
            },
            task_config: { hangup_after_silence: 30 },
          },
        ],
      },
      agent_prompts: { task_1: { system_prompt: currentAgent.system_prompt } },
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setStatus({
          type: 'success',
          message: `Agent ${isEdit ? 'updated' : 'created'} successfully! ID: ${data.agent_id}`,
        });
        resetForm();
        fetchAgents();
      } else {
        throw new Error(data.detail || 'Request failed');
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: `Error ${isEdit ? 'updating' : 'creating'} agent: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  };

  const handleMakeCall = async (e: React.FormEvent, agentId: string, phoneNumber: string) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://voiceaiagent.tech:8001/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, recipient_phone_number: phoneNumber }),
      });
      if (response.ok) {
        setCallStatus({ type: 'success', message: 'Call initiated successfully!' });
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to initiate call');
      }
    } catch (err) {
      setCallStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to initiate call' });
    }
  };

  const handleCleanupOrphanedAgents = async () => {
    if (!window.confirm('This will remove agent data files that exist in storage but not in the database. Are you sure?')) return;
    
    try {
      const response = await fetch(`http://voiceaiagent.tech:5001/cleanup/orphaned-agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        const deletedCount = result.results.deleted_directories.length;
        const errorCount = result.results.errors.length;
        
        if (deletedCount > 0) {
          setStatus({ 
            type: 'success', 
            message: `Cleanup completed! Removed ${deletedCount} orphaned agent(s).${errorCount > 0 ? ` ${errorCount} errors occurred.` : ''}` 
          });
          
          // Auto-clear status after 5 seconds
          setTimeout(() => setStatus(null), 5000);
        } else {
          setStatus({ type: 'success', message: 'No orphaned agent data found.' });
          setTimeout(() => setStatus(null), 3000);
        }
        
        // Refresh the agents list in case any were affected
        fetchAgents();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to cleanup orphaned agents');
      }
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to cleanup orphaned agents' });
    }
  };

  const resetForm = () => {
    setCurrentAgent(null);
    setIsEditing(false);
    setActiveTabIndex(0);
    setStatus(null);
  };

  const handleNewAgentClick = () => {
    setIsEditing(false);
    setCurrentAgent(getDefaultAgentState());
    setActiveTabIndex(0);
    setStatus(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const openChat = (agentId: string) => {
    setChatAgentId(agentId);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setChatAgentId('');
  };

  // ── JSX ───────────────────────────────────────────────────────────────────────
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
            {/*
              Use flex items-center py-3 px-4. If sidebar is closed, hide the text <span>.
            */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTabIndex(0);
              }}
              className={`
                menu-item flex items-center py-3 px-4
                ${activeTabIndex === 0
                  ? 'text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}
              `}
            >
              <span className="material-icons sidebar-icon">apps</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Agents</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">history</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>History</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">dialpad</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Numbers</span>
            </a>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTabIndex(3);
              }}
              className={`
                menu-item flex items-center py-3 px-4
                ${activeTabIndex === 3
                  ? 'text-indigo-600 bg-indigo-50 border-r-4 border-indigo-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}
              `}
            >
              <span className="material-icons sidebar-icon">call_received</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Inbound</span>
            </a>
            

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">storage</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>KBs</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">receipt_long</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Batches</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">mic</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Voices</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <span className="material-icons sidebar-icon">code</span>
              <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>API Keys</span>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="menu-item flex items-center py-3 px-4 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
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
            className="menu-item flex items-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 py-2 px-2 rounded-lg"
          >
            <span className="material-icons sidebar-icon">account_circle</span>
            <span className={`${isSidebarOpen ? 'ml-3 font-medium' : 'hidden'}`}>Profile</span>
          </a>
          <button
            onClick={handleLogout}
            className="menu-item flex items-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 py-2 px-2 rounded-lg w-full text-left"
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
          flex-1 p-6 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'ml-64' : 'ml-[4.5rem]'}
        `}
      >
        {/* ── Header ────────────────────────────────────────────────────────────── */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Agent setup</h1>
          {/* <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              Available balance: <span className="font-medium text-gray-800">$0.13</span>
            </span>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span className="material-icons text-lg mr-2">add_circle_outline</span> Add more funds
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              See demo <span className="material-icons text-lg ml-1">east</span>
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Docs <span className="material-icons text-lg ml-1">east</span>
            </button>
          </div> */}
        </header>

        {/* ── Grid Layout ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-6">
          {/* ── Left Column: Your Agents ───────────────────────────────────────── */}
          <div className="col-span-3 bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Agents</h2>
              <div className="flex space-x-2">
                <button
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                  onClick={handleNewAgentClick}
                  title="Create New Agent"
                >
                  <span className="material-icons text-xl">add</span>
                </button>
                <button
                  className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                  onClick={handleCleanupOrphanedAgents}
                  title="Clean up orphaned agent data"
                >
                  <span className="material-icons text-xl">cleaning_services</span>
                </button>
              </div>
            </div>
            <nav className="space-y-2 max-h-96 overflow-y-auto">
              {agents.length === 0 ? (
                <p className="text-gray-500 text-sm">No agents found</p>
              ) : (
                agents.map((agent) => (
                  <div key={agent.agent_id} className="flex items-center space-x-2">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        loadAgentForEdit(agent.agent_id);
                      }}
                      className={`
                        flex-1 block px-4 py-2.5 text-sm rounded-lg cursor-pointer
                        ${
                          currentAgent?.agent_id === agent.agent_id
                            ? 'text-indigo-600 bg-indigo-50 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      {agent.data.agent_name}
                    </a>
                    <button
                      onClick={() => openChat(agent.agent_id)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Test Agent"
                    >
                      <span className="material-icons text-sm">chat</span>
                    </button>
                  </div>
                ))
              )}
            </nav>
          </div>

          {/* ── Middle Column: Agent Details ──────────────────────────────────── */}
          <div className="col-span-6 bg-white p-6 rounded-xl shadow-lg">
            {/* Title & Action Buttons */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {currentAgent
                  ? isEditing
                    ? `Editing: ${currentAgent.agent_name}`
                    : 'New Agent'
                  : 'Select or Create Agent'}
              </h2>
            </div>

            

            {/* Tabs Navigation */}
            {currentAgent && (
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-6 -mb-px">
                  {[
                    { label: 'Agent', icon: 'person_outline' },
                    { label: 'LLM', icon: 'psychology' },
                    { label: 'Voice', icon: 'record_voice_over' },
                    { label: 'Inbound', icon: 'call_received', path: '/inbound-agent' },
                  ].map((tab, idx) => (
                    <a
                      key={idx}
                      href="#"
                      onClick={(e) => {
                        if (tab.path) {
                          navigate(tab.path);
                        } else {
                          e.preventDefault();
                          setActiveTabIndex(idx);
                        }
                      }}
                      className={`
                        flex items-center py-3 px-1 text-sm border-b-2 whitespace-nowrap
                        ${
                          activeTabIndex === idx
                            ? 'text-indigo-600 border-indigo-600 font-medium'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-transparent'
                        }
                      `}
                    >
                      <span className="material-icons text-lg mr-2">{tab.icon}</span>
                      {tab.label}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Tab Content & Form */}
            {currentAgent && (
              <form id="agent-form" onSubmit={handleAgentSubmit}>
                <div className="tab-content">
                  {/* ── Agent Tab ─────────────────────────────────────────────────── */}
                  {activeTabIndex === 0 && (
                    <div id="agent-tab">
                      <div className="mb-4">
                        <label
                          htmlFor="agent-name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Agent Name:
                        </label>
                        <input
                          id="agent-name"
                          type="text"
                          value={currentAgent.agent_name}
                          onChange={(e) =>
                            setCurrentAgent((prev) =>
                              prev
                                ? { ...prev, agent_name: e.target.value }
                                : { ...getDefaultAgentState(), agent_name: e.target.value }
                            )
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label
                          htmlFor="welcome-message"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Agent Welcome Message:
                        </label>
                        <input
                          id="welcome-message"
                          type="text"
                          value={currentAgent.welcome_message}
                          onChange={(e) =>
                            setCurrentAgent((prev) =>
                              prev
                                ? { ...prev, welcome_message: e.target.value }
                                : { ...getDefaultAgentState(), welcome_message: e.target.value }
                            )
                          }
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This will be the initial message from the agent.
                        </p>
                      </div>
                      <div className="mb-4">
                        <label
                          htmlFor="agent-prompt"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          System Prompt:
                        </label>
                        <textarea
                          id="agent-prompt"
                          value={currentAgent.system_prompt}
                          onChange={(e) =>
                            setCurrentAgent((prev) =>
                              prev
                                ? { ...prev, system_prompt: e.target.value }
                                : { ...getDefaultAgentState(), system_prompt: e.target.value }
                            )
                          }
                          rows={4}
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <div className="text-right mt-1">
                          <button
                            type="button"
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Help me build my agent{' '}
                            <span className="material-icons text-sm align-middle">
                              east
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── LLM Tab ────────────────────────────────────────────────────── */}
                  {activeTabIndex === 1 && (
                    <div id="llm-tab">
                      <div className="p-4 bg-gray-50 rounded-lg mb-4">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          LLM Settings
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="llm-model"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Model:
                            </label>
                            <select
                              id="llm-model"
                              value={currentAgent.model}
                              onChange={(e) =>
                                setCurrentAgent((prev) =>
                                  prev
                                    ? { ...prev, model: e.target.value }
                                    : { ...getDefaultAgentState(), model: e.target.value }
                                )
                              }
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="gpt-4o-mini">GPT-4o Mini</option>
                              <option value="gpt-4-turbo">GPT-4 Turbo</option>
                              <option value="gpt-4">GPT-4</option>
                              <option value="deepseek-chat">DeepSeek Chat</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Temperature
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              defaultValue="0.7"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Voice Tab ──────────────────────────────────────────────────── */}
                  {activeTabIndex === 2 && (
                    <div id="voice-tab">
                      <div className="p-4 bg-gray-50 rounded-lg mb-4">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          Voice Settings
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="voice-provider"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Voice Provider:
                            </label>
                            <select
                              id="voice-provider"
                              value={currentAgent.voiceProvider}
                              onChange={(e) => {
                                const provider = e.target.value as 'deepgram' | 'elevenlabs';
                                setCurrentAgent((prev) =>
                                  prev
                                    ? { 
                                        ...prev, 
                                        voiceProvider: provider,
                                        voice: provider === 'elevenlabs' ? 'Rachel' : 'thalia',
                                        voiceId: provider === 'elevenlabs' ? '21m00Tcm4TlvDq8ikWAM' : undefined
                                      }
                                    : { 
                                        ...getDefaultAgentState(), 
                                        voiceProvider: provider,
                                        voice: provider === 'elevenlabs' ? 'Rachel' : 'thalia',
                                        voiceId: provider === 'elevenlabs' ? '21m00Tcm4TlvDq8ikWAM' : undefined
                                      }
                                );
                                // Set selected ElevenLabs voice for preview
                                if (provider === 'elevenlabs') {
                                  setSelectedElevenLabsVoice(ELEVENLABS_VOICES[0]);
                                }
                              }}
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            >
                              <option value="deepgram">Deepgram</option>
                              <option value="elevenlabs">ElevenLabs</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="voice-select"
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Voice:
                            </label>
                            <select
                              id="voice-select"
                              value={currentAgent.voice}
                              onChange={(e) => {
                                const selectedVoice = e.target.value;
                                let voiceId: string | undefined;
                                let selectedVoiceData: ElevenLabsVoice | null = null;
                                
                                // Map ElevenLabs voices to their IDs
                                if (currentAgent.voiceProvider === 'elevenlabs') {
                                  selectedVoiceData = ELEVENLABS_VOICES.find(v => v.name === selectedVoice) || null;
                                  voiceId = selectedVoiceData?.voice_id;
                                  setSelectedElevenLabsVoice(selectedVoiceData);
                                }
                                
                                setCurrentAgent((prev) =>
                                  prev
                                    ? { ...prev, voice: selectedVoice, voiceId }
                                    : { ...getDefaultAgentState(), voice: selectedVoice, voiceId }
                                );
                              }}
                              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                            >
                              {currentAgent.voiceProvider === 'deepgram' ? (
                                DEEPGRAM_VOICES.map(voice => (
                                  <option key={voice.value} value={voice.value}>
                                    {voice.label}
                                  </option>
                                ))
                              ) : (
                                ELEVENLABS_VOICES.map(voice => (
                                  <option key={voice.voice_id} value={voice.name}>
                                    {voice.name} ({voice.labels.gender || 'unknown'}, {voice.labels.accent || 'unknown'})
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                          {currentAgent.voiceProvider === 'elevenlabs' && (
                            <div>
                              <label
                                htmlFor="elevenlabs-model"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                ElevenLabs Model:
                              </label>
                              <select
                                id="elevenlabs-model"
                                value={currentAgent.elevenLabsModel || 'eleven_turbo_v2_5'}
                                onChange={(e) =>
                                  setCurrentAgent((prev) =>
                                    prev
                                      ? { ...prev, elevenLabsModel: e.target.value }
                                      : { ...getDefaultAgentState(), elevenLabsModel: e.target.value }
                                  )
                                }
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="eleven_turbo_v2_5">Eleven Turbo v2.5</option>
                                <option value="eleven_turbo_v2">Eleven Turbo v2</option>
                                <option value="eleven_multilingual_v2">Eleven Multilingual v2</option>
                                <option value="eleven_monolingual_v1">Eleven Monolingual v1</option>
                              </select>
                            </div>
                          )}
                          {currentAgent.voiceProvider === 'elevenlabs' && currentAgent.voiceId && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Voice ID:
                              </label>
                              <input
                                type="text"
                                value={currentAgent.voiceId}
                                readOnly
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-100"
                              />
                            </div>
                          )}
                          {currentAgent.voiceProvider === 'elevenlabs' && selectedElevenLabsVoice && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-800 mb-2">Voice Details:</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <span><strong>Gender:</strong> {selectedElevenLabsVoice.labels.gender || 'Unknown'}</span>
                                <span><strong>Accent:</strong> {selectedElevenLabsVoice.labels.accent || 'Unknown'}</span>
                                <span><strong>Age:</strong> {selectedElevenLabsVoice.labels.age || 'Unknown'}</span>
                                <span><strong>Category:</strong> {selectedElevenLabsVoice.category || 'Unknown'}</span>
                              </div>
                              {selectedElevenLabsVoice.labels.description && (
                                <div className="mt-2 text-xs">
                                  <strong>Description:</strong> {selectedElevenLabsVoice.labels.description}
                                </div>
                              )}
                              {selectedElevenLabsVoice.description && (
                                <div className="mt-2 text-xs italic">
                                  {selectedElevenLabsVoice.description}
                                </div>
                              )}
                              {selectedElevenLabsVoice.labels.use_case && (
                                <div className="mt-2 text-xs">
                                  <strong>Use Case:</strong> {selectedElevenLabsVoice.labels.use_case}
                                </div>
                              )}
                              {selectedElevenLabsVoice.preview_url && (
                                <div className="mt-3">
                                  <audio controls className="w-full h-8 text-xs">
                                    <source src={selectedElevenLabsVoice.preview_url} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                  </audio>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Inbound Tab ───────────────────────────────────────────────── */}
                  {activeTabIndex === 3 && (
                    <div id="inbound-tab">
                      <div className="p-4 bg-gray-50 rounded-lg mb-4">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          Inbound Agent Settings
                        </h3>
                        <p className="text-gray-500">Inbound agent configuration will go here</p>
                      </div>
                    </div>
                  )}
                  
                </div>

                {/* ── Save / Delete Buttons ──────────────────────────────────────── */}
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                  >
                    <span className="material-icons text-lg mr-2">save</span>
                    {isEditing ? 'Update Agent' : 'Save Agent'}
                  </button>
                  {isEditing && currentAgent && (
                    <button
                      type="button"
                      onClick={() => deleteAgent(currentAgent.agent_id)}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <span className="material-icons text-lg">delete_outline</span>
                      <span>Delete Agent</span>
                    </button>
                  )}
                </div>

                {/* ── Status Message ─────────────────────────────────────────────── */}
                {status && (
                  <div
                    className={`mt-4 p-3 rounded ${
                      status.type === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {status.message}
                  </div>
                )}
              </form>
            )}
          </div>

          {/* ── Right Column: Extras & Make Call ───────────────────────────── */}
          <div className="col-span-3 space-y-4">
            {/* See all call logs */}
            {/* <div className="bg-white p-4 rounded-xl shadow-lg">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex justify-between items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                See all call logs <span className="material-icons text-lg">arrow_forward</span>
              </a>
            </div> */}

            {/* Test via chat */}
            {currentAgent && isEditing && (
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <p className="text-sm text-gray-700 mb-3">
                  Use chat to test agent &amp; prompts
                </p>
                <button 
                  onClick={() => openChat(currentAgent.agent_id)}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Test your prompt via chat
                </button>
              </div>
            )}

            {/* Start web call */}
            {/* <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <p className="text-sm text-gray-700 mb-3">
                Have a web call with your agent to test &amp; experience it (Beta)
              </p>
              <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                Start web call
              </button>
            </div> */}

            {/* Make Call Section */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
              <h2 className="text-lg md:text-xl font-semibold mb-4">Initiate Call</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget as HTMLFormElement;
                  const agentId = (form.elements.namedItem('agentId') as HTMLSelectElement).value;
                  const phoneNumber = (form.elements.namedItem('phoneNumber') as HTMLInputElement).value;
                  handleMakeCall(e, agentId, phoneNumber);
                }}
              >
                <div className="mb-4">
                  <label
                    htmlFor="call-agent-select"
                    className="block text-sm md:text-base font-medium mb-1"
                  >
                    Agent:
                  </label>
                  <select
                    name="agentId"
                    id="call-agent-select"
                    className="w-full p-2 text-sm md:text-base border rounded"
                    required
                  >
                    {agents.map((agent) => (
                      <option key={agent.agent_id} value={agent.agent_id}>
                        {agent.data.agent_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="phone-number-input"
                    className="block text-sm md:text-base font-medium mb-1"
                  >
                    Phone:
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    id="phone-number-input"
                    placeholder="+447380907786"
                    className="w-full p-2 text-sm md:text-base border rounded"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm md:text-base"
                >
                  Make Call
                </button>
              </form>

              {callStatus && (
                <div
                  className={`mt-4 p-3 rounded text-sm ${
                    callStatus.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {callStatus.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Chat Bubble Button ───────────────────────────────────────────────── */}
        <button className="fixed bottom-6 right-6 bg-black text-white p-4 rounded-full shadow-xl hover:bg-gray-800 transition-colors">
          <span className="material-icons text-3xl">chat_bubble</span>
        </button>

        {/* ── Chat Component ─────────────────────────────────────────────────── */}
        <Chat 
          agentId={chatAgentId}
          isOpen={isChatOpen}
          onClose={closeChat}
        />
      </main>
    </div>
  );
}