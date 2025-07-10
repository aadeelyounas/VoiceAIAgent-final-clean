import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="bg-gray-100 font-sans min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="bg-white shadow-lg rounded-xl p-8 text-center">
          <div className="flex justify-center mb-8">
            <img 
              alt="Company logo" 
              className="h-8 w-auto" 
              src="https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-original-577x577/s3/072011/univeristy_of_bedfordshire.png?itok=wtWy9xfn"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Welcome to VoiceAgentAI</h1>
          <p className="text-gray-600 mb-6">
            VoiceAgentAI is a real-time, human-like conversational voice agent powered by OpenAI's models.
            It integrates with Twilio and Deepgram for seamless voice interactions with low latency.
            Login or register to experience the future of voice AI.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/login" className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Login
            </Link>
            <Link to="/register" className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}