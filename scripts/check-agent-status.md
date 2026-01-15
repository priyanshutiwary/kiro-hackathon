# Check if Your Python Agent is Running

Your Python agent needs to be running and connected to LiveKit for calls to work.

## How to Start Your Agent

1. Open a terminal
2. Navigate to the agent directory:
   ```bash
   cd agent
   ```

3. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

4. Run the agent:
   ```bash
   python main.py dev
   ```

## What You Should See

When the agent starts successfully, you should see:
```
INFO:payment-agent:Starting payment reminder agent...
INFO:livekit:Connecting to LiveKit server...
INFO:livekit:Connected successfully
INFO:livekit:Waiting for jobs...
```

## Check Agent Status

The agent should show:
- ✅ Connected to LiveKit server
- ✅ Listening for jobs
- ✅ Agent name: payment-reminder-agent

## Common Issues

1. **Agent not running**: Start it with `python main.py dev`
2. **Wrong credentials**: Check `agent/.env.local` has correct LiveKit credentials
3. **Network issues**: Make sure you can reach the LiveKit server

## Test the Flow

Once the agent is running:
1. Hit `/api/cron/process-reminders` from your Next.js app
2. The agent should receive a job and log:
   ```
   INFO:payment-agent:NEW JOB RECEIVED
   INFO:payment-agent:Room: payment-reminder-xxxxx
   ```
3. The agent will join the room and make the call

## Alternative: Check LiveKit Dashboard

Go to your LiveKit dashboard at:
https://cloud.livekit.io/

Check:
- Are there any active agents connected?
- Are rooms being created?
- Are SIP calls being dispatched?
