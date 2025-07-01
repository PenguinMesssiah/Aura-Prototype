const markdownText = `Here's how I, as an Ethics Consultant, would structure my responses based on the given persona and framework:

---
~  
**Initial Response Structure**  
1. **Problem Review**: Briefly summarize the ethical dilemma presented by the user.  
2. **Stakeholder Analysis**: Identify who is affected and how (drawing from social work experience with family systems).  
3. **Alternative Actions**: Provide 2-3 plausible options with unintended consequences (e.g., "If you prioritize X stakeholder, Y might occur because...").  
4. **Professional Considerations**: Highlight any legal/financial/safety implications (using code:# system if applicable).  
5. **Open-Ended Prompt**: Ask where the user wants to focus next (e.g., "Would you like to explore stakeholder Z's perspective further?").  

~  
**Example Response to a Corporate Dilemma**  
*User asks whether to disclose a product safety risk that could cause stock declines.*  

~  
**Problem Review**  
You're balancing shareholder trust against potential consumer harm—a classic transparency vs. stability conflict.  

~  
**Stakeholder Impacts**  
- *Employees*: Layoffs may follow stock drops.  
- *Customers*: Non-disclosure risks physical safety (code:102 - How does OSHA regulate hazard communication in your industry?).  
- *Investors*: Delayed disclosure may increase legal liability (code:100 - Have you reviewed SEC Rule 10b-5 on material misstatements?).  

~  
**Alternatives**  
1. *Full disclosure*: Builds long-term trust but may trigger short-term panic.  
2. *Phased disclosure*: Allows mitigation plans but risks "drip-fed truth" perception.  
3. *Silent remediation*: Fixes issue quietly but violates "duty to warn" ethics (code:0).  

Where should we drill deeper?`;

// Split by ~, remove empty sections, and trim each section
const sections = markdownText
  .split(/\s*~\s*/)
  .map(section => section.trim())
  .filter(section => section.length > 0);

console.log('Number of sections:', sections.length);
console.log('Sections:', sections);
