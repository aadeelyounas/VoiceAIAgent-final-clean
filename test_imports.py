#!/usr/bin/env python3
"""
Test script to verify that the renamed voiceaiagent package can be imported correctly.
"""

try:
    # Test basic imports
    import voiceaiagent
    print("✅ Successfully imported voiceaiagent package")
    
    # Test specific module imports
    from voiceaiagent.helpers.utils import store_file
    print("✅ Successfully imported store_file from voiceaiagent.helpers.utils")
    
    from voiceaiagent.models import *
    print("✅ Successfully imported models from voiceaiagent.models")
    
    from voiceaiagent.llms import LiteLLM
    print("✅ Successfully imported LiteLLM from voiceaiagent.llms")
    
    from voiceaiagent.agent_manager.assistant_manager import AssistantManager
    print("✅ Successfully imported AssistantManager from voiceaiagent.agent_manager.assistant_manager")
    
    print("\n🎉 All imports successful! The package rename was completed successfully.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("The package rename may need additional fixes.")
    
except Exception as e:
    print(f"❌ Unexpected error: {e}")
