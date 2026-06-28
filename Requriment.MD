CyberHunt Platform — Feature Update Spec

Platform: CyberHunt (cyberpunk-themed CTF/puzzle competition at cyberhunt.techalfa.in), built on Next.js + Firebase (migrating from Supabase).

Changes needed (not full redesign — component/logic updates only):

Question/Mission edit UI — Admin can change/edit the question or mission content without touching code.
Sequential unlock system — Question 10 is locked until Q9 is solved. Each question unlocks only after the previous is completed (1→2→...→10). Unlock key concept TBD.
Hints system — 3 hints per question shown in admin panel. Not spoon-fed — hints are progressive/tiered, player must choose to reveal each.
Question cards — Display questions as styled cards. Q9 is accessible; Q10 is locked until Q9 solved.
Submission limit — Max 1 submission attempt per question per team.
Difficulty levels — Q1–Q3 = Easy, Q4–Q6 = Medium, Q7–Q10 = Hard. Shown on cards.
Terms & Rules page — Editable content from admin panel.
Scoreboard — Fixed bottom-right, scrollable, displays team names + scores.
Firebase integration — Replace Supabase; connect all data (questions, hints, teams, scores) to Firebase Firestore.
Result/PDF output — Auto-calculate final participation results, deduct hint penalty points, export as PDF.
(Optional) Admin approval flow — Admin approves submitted answers; triggers score calculation.
Now let me build the updated dashboard UI as a React artifact with all these features mocked/interactive:

Now let me build the full interactive dashboard mockup:



Here's a full interactive mockup of the updated CyberHunt dashboard. Here's what's all wired up and clickable:

Click any question card → see the mission details, tiered hints (click to reveal, -10/-20 pts deducted), and the 1-submission limit in action. Q10 stays locked until Q9 is solved.

Sidebar nav:

Edit Questions → pick any card, edit title + mission + all 3 hints + answer key inline
Terms & Rules → full editable text area pre-filled with proper rules
Export Results → auto-calculated table with raw pts, hint deductions, and final score per team
Admin Controls panel (right side on Missions view):

Edit question → opens modal for the selected question
Approve answer → manually mark a submitted answer as correct
Export PDF → triggers the result export flow
Scoreboard is the fixed scrollable panel on the bottom-right of the missions view showing team names + scores.

Next steps for the real build:

The spec I framed at the top is ready to paste into any model (GPT/Claude/Gemini) to generate the actual Firebase schema + Next.js components. The key things still to wire:

Firebase Firestore collections: questions, teams, submissions, hints_used
Answer hashing (SHA-256 on submission before comparing stored hash)
PDF export via jsPDF + auto-calculated deductions
Real-time scoreboard via onSnapshot()
Want me to generate the Firebase schema + Next.js component code next?



first hint 20% and second hint for 50%