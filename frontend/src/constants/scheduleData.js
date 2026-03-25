export const scheduleData = [
  // Monday - Marcus morning, Derek evening
  { id: 1, employee: 'Marcus J.', day: 'Monday', role: 'Cook', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 96 },
  { id: 2, employee: 'Lisa T.', day: 'Monday', role: 'Server', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 80 },
  { id: 3, employee: 'Derek M.', day: 'Monday', role: 'Cook', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 96 },
  { id: 4, employee: 'Sara P.', day: 'Monday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 5, employee: 'James C.', day: 'Monday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 6, employee: 'Nina F.', day: 'Monday', role: 'Bartender', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 104 },

  // Tuesday - Derek morning, Marcus evening
  { id: 7, employee: 'Derek M.', day: 'Tuesday', role: 'Cook', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 96 },
  { id: 8, employee: 'Rachel K.', day: 'Tuesday', role: 'Server', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 80 },
  { id: 9, employee: 'Marcus J.', day: 'Tuesday', role: 'Cook', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 96 },
  { id: 10, employee: 'Lisa T.', day: 'Tuesday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 11, employee: 'James C.', day: 'Tuesday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 12, employee: 'Nina F.', day: 'Tuesday', role: 'Bartender', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 104 },

  // Wednesday - Marcus morning, Derek evening | Nina off, Carlos on
  { id: 13, employee: 'Marcus J.', day: 'Wednesday', role: 'Cook', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 96 },
  { id: 14, employee: 'Rachel K.', day: 'Wednesday', role: 'Server', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 80 },
  { id: 15, employee: 'Derek M.', day: 'Wednesday', role: 'Cook', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 96 },
  { id: 16, employee: 'Sara P.', day: 'Wednesday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 17, employee: 'Rachel K.', day: 'Wednesday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 18, employee: 'Carlos R.', day: 'Wednesday', role: 'Bartender', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 104 },

  // Thursday - Derek morning, Marcus evening | Nina off, Carlos on
  { id: 19, employee: 'Derek M.', day: 'Thursday', role: 'Cook', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 96 },
  { id: 20, employee: 'Lisa T.', day: 'Thursday', role: 'Server', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 80 },
  { id: 21, employee: 'Marcus J.', day: 'Thursday', role: 'Cook', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 96 },
  { id: 22, employee: 'Sara P.', day: 'Thursday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 23, employee: 'James C.', day: 'Thursday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 24, employee: 'Carlos R.', day: 'Thursday', role: 'Bartender', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 104 },

  // Friday - Marcus morning, Derek evening + Shift Lead
  { id: 25, employee: 'Marcus J.', day: 'Friday', role: 'Cook', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 96 },
  { id: 26, employee: 'Rachel K.', day: 'Friday', role: 'Server', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 80 },
  { id: 27, employee: 'Tony N.', day: 'Friday', role: 'Shift Lead', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 130 },
  { id: 28, employee: 'Derek M.', day: 'Friday', role: 'Cook', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 96 },
  { id: 29, employee: 'Lisa T.', day: 'Friday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 30, employee: 'Sara P.', day: 'Friday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 31, employee: 'Carlos R.', day: 'Friday', role: 'Bartender', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 104 },

  // Saturday - Derek morning, Marcus evening + Shift Lead
  { id: 32, employee: 'Derek M.', day: 'Saturday', role: 'Cook', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 96 },
  { id: 33, employee: 'Rachel K.', day: 'Saturday', role: 'Server', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 80 },
  { id: 34, employee: 'Tony N.', day: 'Saturday', role: 'Shift Lead', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 130 },
  { id: 35, employee: 'Marcus J.', day: 'Saturday', role: 'Cook', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 96 },
  { id: 36, employee: 'Sara P.', day: 'Saturday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 37, employee: 'Rachel K.', day: 'Saturday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 38, employee: 'Nina F.', day: 'Saturday', role: 'Bartender', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 104 },

  // Sunday - lighter day, bar closed
  { id: 39, employee: 'Derek M.', day: 'Sunday', role: 'Cook', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 96 },
  { id: 40, employee: 'Lisa T.', day: 'Sunday', role: 'Server', startTime: '10:00 AM', endTime: '4:00 PM', estimatedEarnings: 80 },
  { id: 41, employee: 'Marcus J.', day: 'Sunday', role: 'Cook', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 96 },
  { id: 42, employee: 'Sara P.', day: 'Sunday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
  { id: 43, employee: 'James C.', day: 'Sunday', role: 'Server', startTime: '4:00 PM', endTime: '10:00 PM', estimatedEarnings: 80 },
]