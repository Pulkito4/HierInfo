"""
News Pipeline - Quick Command Reference

This file provides quick commands for testing and running the news pipeline.
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and display results."""
    print(f"\n🔧 {description}")
    print(f"💻 Command: {cmd}")
    print("-" * 50)
    
    try:
        result = subprocess.run(cmd, shell=True, cwd="/Users/tanishkagoel/Desktop/HierInfo/backend", 
                              capture_output=False, text=True)
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error running command: {e}")
        return False

def main():
    """Show available commands and run selected ones."""
    
    print("🚀 News Pipeline - Command Reference")
    print("=" * 50)
    
    commands = {
        "1": ("python main_functional.py --test", "Test mode (3 articles)"),
        "2": ("python main_functional.py --test --articles 5", "Test with 5 articles"),
        "3": ("python main_functional.py --articles 20", "Production mode (20 articles)"),
        "4": ("python main_functional.py --articles 50", "Production mode (50 articles)"),
        "5": ("python main_functional.py --test --no-batch", "Test mode with sequential parsing"),
    }
    
    print("\n📋 Available Commands:")
    for key, (cmd, desc) in commands.items():
        print(f"  {key}. {desc}")
        print(f"     💻 {cmd}")
    
    print("\n🎯 Recommended Workflow:")
    print("  1. Start with test mode to verify setup")
    print("  2. Scale up gradually (5 → 20 → 50 articles)")
    print("  3. Monitor logs in backend/logs/ directory")
    print("  4. Ready for deployment when consistently working")
    
    choice = input(f"\n👉 Select command to run (1-{len(commands)}) or 'q' to quit: ").strip()
    
    if choice.lower() == 'q':
        print("👋 Goodbye!")
        return
    
    if choice in commands:
        cmd, desc = commands[choice]
        run_command(cmd, desc)
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()