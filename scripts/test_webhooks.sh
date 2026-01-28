curl -X POST http://localhost:3000/api/webhooks/twilio/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM1234567890&MessageStatus=delivered&To=+1234567890&From=+0987654321"

curl -X POST http://localhost:3000/api/cron/process-reminders \
  -H "Authorization: Bearer b1a01f9aca1f560bcbcb2000f235f0f1511ea8874bd7a180de4eaa287686cc7a"
