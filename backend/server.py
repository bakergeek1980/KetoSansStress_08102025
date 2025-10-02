#!/usr/bin/env python3
"""
KetoSansStress API Server Entry Point
Redirects to new main.py application
"""

import sys
import os

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Import and run the main application
if __name__ == "__main__":
    from main import app
    import uvicorn
    
    uvicorn.run(app, host="0.0.0.0", port=8001)
else:
    # For importing in other modules
    from main import app