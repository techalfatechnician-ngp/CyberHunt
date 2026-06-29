# 🎯 Operation Blackout: Master Event Design

**Theme:** Think like a detective, hack like an engineer.
**Goal:** Teams collect 9 cryptic "fragments" across 9 different cybersecurity challenges. In the 10th challenge, they must combine all fragments to form the master decryption key.

Here is the complete sequence of the event based on your brilliant ideas, incorporating the **platform loop**:

### 🧩 Level 1: The Initial Breach (GitHub Source)
* **The Challenge:** Participants are given a link to a public GitHub repository belonging to TechAlfa. 
* **The Solution:** They must manually search through the source code files to find the first fragment hidden in a basic code comment.

### 🕰️ Level 2: The Forgotten Commit (GitHub History)
* **The Challenge:** The current code has no more clues. The hint points them to the past.
* **The Solution:** Participants must check the Git commit history from the past 10 days to find a commit where a developer accidentally leaked the 2nd fragment before deleting it.

### 🔐 Level 3: The Dummy Portal (Vercel)
* **The Challenge:** The Level 2 fragment gives them a link to a dummy login page hosted on Vercel. The hint is *"Sometimes you are the solution."*
* **The Solution:** They must log in using their registered Email Address as the username, and their assigned **Team ID** as the password to retrieve the 3rd fragment.

### 🔍 Level 4: The Needle in a Haystack (Back to GitHub)
* **The Challenge:** The Level 3 success message loops them *back* to the original platform with the hint: *"Sometimes you forget to check the source code."*
* **The Solution:** They return to the GitHub repo, which now has a massive new directory containing 10 files with 2,000 lines of code each (20,000 lines total!). They must use text searching skills (`Ctrl+F` or `grep`) to find the 4th fragment buried deep inside the noise.



 //level 5 main website event pop out : tech alfa 


 // level 6 

### 🛑 Level 5: The AI Trap (Back to Vercel)
* **The Challenge:** The hint sends them back to the Vercel dummy site. This puzzle is designed to defeat students relying purely on AI tools. 
* **The Solution:** They must open their browser's Developer Tools (F12) and check the **Console** tab on the website. 
* **Implementation Detail:** When the student tries to "Login" on the dummy site, the UI will not update, but a JavaScript event will trigger a fake `console.error()` containing the fragment (e.g., `console.error("AuthService Exception: Missing secure token. Fragment found in dump: KEY='E'");`).

### 🕵️‍♂️ Level 6: Open Source Intelligence (Instagram/Socials)
* **The Challenge:** The trail breaks away from code and onto social media.
* **The Solution:** Participants must hunt through TechAlfa's official Instagram or LinkedIn pages to find a specific post where the 6th fragment is cleverly hidden in an image or caption.

### 🗄️ Level 7: The Matryoshka Archive (TechAlfa Site)
* **The Challenge:** The social media post directs them to download a compressed file from the official TechAlfa website.
* **The Solution:** They must extract a nested ZIP file **4 times** (unzipping a zip within a zip) to finally reach the text document containing the 7th fragment.
* **Implementation Detail:** The multi-layered ZIP file is created locally by zipping the text file, zipping that zip, and repeating 4 times. The final `archive.zip` is placed in the `public/` directory of the web application, making it downloadable via a simple link: `<a href="/archive.zip" download>Download Evidence</a>`.

### 💻 Level 8: The Engineer's Trial (Coding -> LinkedIn)
* **The Challenge:** Participants are presented with 4 small coding problems.
* **The Solution:** Solving each problem outputs a small piece of a URL. They arrange the 4 pieces into a valid TechAlfa LinkedIn URL, which contains the 8th fragment.
* **Implementation Detail:** Provide 4 Python scripts that output: `linkedin.com`, `techalfa`, `https://`, and `/company/`. The students must figure out the outputs and combine them to form `https://linkedin.com/company/techalfa`. The actual fragment is hidden somewhere on that LinkedIn page.

### 💥 Level 9: The Data Breach (Rainbow Tables)
* **The Challenge:** Participants download a text file containing a "leaked database" with usernames and **MD5 Password Hashes**.
* **The Solution:** They must copy the hash and use an online MD5 cracker (a rainbow table) to decrypt it into a readable word. The decrypted word is the 9th fragment.

### 👑 Level 10: The Final Decryption (The Boss Level)
* **The Challenge:** They have collected 9 single-letter fragments (e.g. `C`, `O`, `S`, `L`, `T`, `B`, `A`, `K`, `U`).
* **The Solution:** They must unscramble these 9 letters to spell the final Master Key. The correct anagram spells **`BLACKOUTS`**. Submitting this key completes Operation Blackout!

we are getting 9 fragments but in final they 7 leeter to form 

yese word dhundne hai jiske multiple real world word bane yaa meaningful words bane/

## Game Mechanics & Rules

1. **Submission Limit**: Teams have a maximum of 10 submissions allowed across the hunt.
2. **Non-linear Progression**: Teams can solve Missions 1 through 9 randomly and in any order. They do not need to be solved sequentially.
3. **Fragment Anagram Mechanic**: 
   - Across the 9 missions, teams will randomly collect 9 single-letter fragments (e.g., C, Y, B, E, R, H, U, N, T).
   - The letters are given randomly, NOT in the correct sequential order of the final word.
4. **Mission 10 Unlock**: Mission 10 remains strictly locked until all 9 fragments have been collected from the previous missions. 
5. **The Final Challenge**: In Mission 10, teams must unscramble the 9 randomly collected letters to form the final meaningful Master Key (e.g., "CYBERHUNT").
6. **Final Countdown**: Once Mission 10 is unlocked and started, a strict 15-minute countdown timer begins.


source code -1
commit-3 
dummy website console error  - 4
zip file -2
insta bio link tree - 5
privacy policiy - 6 main website;
coding - 7
leak database - 8

🔥 Level 9: "The Ghost Protocol"
The Setup
Students receive what looks like a completely blank/broken page — just a URL. No instructions. No visible content. The hint from Level 8 just says:

"The server knows more than it shows."

What's Actually Happening
The fragment is hidden inside the HTTP Response Headers of that page.
When they visit the URL, the page looks dead. But if they open DevTools → Network tab → click the request → look at Response Headers, they'll see a custom header:
X-Classified-Data: FragmentKey=R
Why This Destroys Everyone
AI can't help — if they paste the page into ChatGPT, there's literally no content to analyze. The page is empty.
Cybersecurity students will overthink it — they'll immediately jump to:

Steganography? No image.
Source code? Empty.
Cookies? Nothing unusual.
robots.txt? Clean.
JavaScript? None.

They'll spend 20 minutes looking at the wrong layers of the web stack.
The skill is real — HTTP headers are fundamental to web security. Every pentester uses them daily. But students never think to look there in a CTF context because challenges usually involve content, not protocol metadata.

How to Implement (Dead Simple)
In your Next.js app, one route:
javascript// app/ghost/route.js
export async function GET() {
  return new Response("", {
    headers: {
      "X-Classified-Data": "FragmentKey=R",
      "Content-Type": "text/html",
    },
  });
}
Done. The page renders blank. The header sits invisible to the naked eye.

The Misdirection Layer (Optional but Deadly)
Add a fake rabbit hole — put this in the page's HTML:
html<!-- TODO: remove before deployment - key stored in /config -->
Students who check source code find this comment and waste time hunting /config which returns 404. The ones who give up on source code and check headers find the fragment.
This makes even the hint structure deceptive — which is what separates a great CTF from a standard one.


LEVEL 10 = Arch Linux

X , C , U
 A , L , N
 R , H, I

KEY = 

