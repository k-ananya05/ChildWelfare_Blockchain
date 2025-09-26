#!/bin/bash

echo "🌐 Starting Frontend Demo"
echo "========================"

cd frontend

# Set environment for NGO node
echo "VITE_API_URL=http://localhost:5002" > .env.local
echo "VITE_WS_URL=ws://localhost:5002" >> .env.local

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🚀 Starting frontend on http://localhost:5173"
echo ""
echo "Demo Features:"
echo "• /roles - Role-based transactions with MetaMask signing"
echo "• /blocks - Live blockchain visualization" 
echo "• /contract - Smart contract interaction"
echo ""
echo "Press Ctrl+C to stop"

npm run dev
