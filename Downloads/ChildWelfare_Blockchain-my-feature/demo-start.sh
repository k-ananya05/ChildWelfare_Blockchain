#!/bin/bash

echo "🚀 Starting Child Welfare Blockchain Demo"
echo "========================================"

# Kill any existing processes on ports 5002-5005
echo "🧹 Cleaning up existing processes..."
for port in 5002 5003 5004 5005; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done

# Wait a moment
sleep 2

echo ""
echo "🏗️  Starting 4 blockchain nodes..."

# Start nodes in background
echo "Starting NGO node (port 5002)..."
PORT=5002 NODE_ROLE=NGO npm start > logs/ngo.log 2>&1 &
NGO_PID=$!

echo "Starting Government node (port 5003)..."
PORT=5003 NODE_ROLE=Government npm start > logs/government.log 2>&1 &
GOV_PID=$!

echo "Starting Hospital node (port 5004)..."
PORT=5004 NODE_ROLE=Hospital npm start > logs/hospital.log 2>&1 &
HOSP_PID=$!

echo "Starting Auditor node (port 5005)..."
PORT=5005 NODE_ROLE=Auditor npm start > logs/auditor.log 2>&1 &
AUD_PID=$!

# Wait for nodes to start
echo ""
echo "⏳ Waiting for nodes to initialize..."
sleep 5

# Create logs directory if it doesn't exist
mkdir -p logs

echo ""
echo "✅ All nodes started!"
echo ""
echo "📊 Node Status:"
echo "NGO:        http://localhost:5002/health"
echo "Government: http://localhost:5003/health" 
echo "Hospital:   http://localhost:5004/health"
echo "Auditor:    http://localhost:5005/health"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "🔄 Leader rotation happens every 30 seconds"
echo "📝 Check logs in ./logs/ directory"
echo ""
echo "Press Ctrl+C to stop all nodes"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all nodes..."
    kill $NGO_PID $GOV_PID $HOSP_PID $AUD_PID 2>/dev/null || true
    echo "✅ Demo stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running and show leader status every 10 seconds
while true; do
    echo ""
    echo "🕐 $(date '+%H:%M:%S') - Current Leaders:"
    for port in 5002 5003 5004 5005; do
        leader=$(curl -s http://localhost:$port/health 2>/dev/null | grep -o '"currentLeader":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        role=$(curl -s http://localhost:$port/health 2>/dev/null | grep -o '"nodeRole":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        isLeader=$(curl -s http://localhost:$port/health 2>/dev/null | grep -o '"isCurrentNodeLeader":[^,]*' | cut -d':' -f2 || echo "false")
        
        if [ "$isLeader" = "true" ]; then
            echo "  Port $port ($role): $leader 👑 LEADER"
        else
            echo "  Port $port ($role): $leader"
        fi
    done
    sleep 10
done
