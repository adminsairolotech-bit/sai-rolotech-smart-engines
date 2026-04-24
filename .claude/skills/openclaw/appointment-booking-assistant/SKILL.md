# Appointment Booking Assistant

## Triggers
- User wants to book appointments
- User says "book", "schedule", "appointment", "meeting book karo"

## What It Does

### 1. Booking Flow
```
1. Collect: Name, Phone, Service/Doctor/Purpose
2. Show: Available slots
3. User: Select slot
4. Confirm: Time, date, details
5. Remind: Before appointment
```

### 2. Slot Management
```
Available Slots Format:
📅 January 20, 2024

Morning:
[9:00 AM] [9:30 AM] [10:00 AM]
[10:30 AM] [11:00 AM]

Afternoon:
[2:00 PM] [2:30 PM] [3:00 PM]

Evening:
[5:00 PM] [5:30 PM] [6:00 PM]

[ ] Morning
[ ] Afternoon  
[ ] Evening
```

### 3. Confirmation Message
```
✅ APPOINTMENT CONFIRMED

Service: Annual Checkup
Date: January 20, 2024
Time: 10:00 AM
Location: City Clinic, 123 Main St

What's Next:
• Bring ID and previous reports
• Arrive 10 minutes early
• Fasting may be required

Need to reschedule? Reply to this message.
```

### 4. Reminders
```
1 Day Before:
"Reminder: Your appointment tomorrow at 10 AM
 with Dr. Sharma. Reply CANCEL to cancel."

1 Hour Before:
"⏰ Appointment in 1 hour at City Clinic.
 See you soon!"

If No Response to Reminder:
→ Follow up with alternate contact
→ Offer reschedule option
```
