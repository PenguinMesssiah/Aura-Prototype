const response = 
```json
{
  "response": {
    "introduction": "Transitioning from a fully manual to a semi-autonomous assembly line is a significant strategic shift that involves balancing innovation with ethical considerations. Let’s explore the potential impacts and alternatives.",
    "situation": "You’re planning to integrate autonomous technology into your manufacturing processes, which will affect employees, customers, and company values. The goal is to innovate while maintaining integrity and minimizing negative consequences.",
    "analysis_of_tradeoffs": "This decision involves tradeoffs between efficiency and employment, cost savings for customers versus potential job losses, and upholding company values during technological advancement.",
    "ethical_dilemma": "How to innovate responsibly without compromising employee welfare or customer trust, while staying true to your company’s values.",
    "unintended_consequence": [
      {
        "title": "Employee Displacement",
        "subtitle": "Job losses due to automation could harm morale and community standing.",
        "stakeholders": [
          {
            "name": "Current Employees",
            "trade_off_subtitle": "Loss of jobs vs. potential for upskilling",
            "potential_impact_summary": "Employees may face unemployment unless retrained for new roles, which could affect their livelihoods and the local economy."
          },
          {
            "name": "Local Community",
            "trade_off_subtitle": "Economic impact vs. technological progress",
            "potential_impact_summary": "Reduced employment could strain local businesses and services that rely on your workforce."
          }
        ]
      },
      {
        "title": "Customer Trust",
        "subtitle": "Price changes or quality shifts could alter customer perceptions.",
        "stakeholders": [
          {
            "name": "Customers",
            "trade_off_subtitle": "Lower prices vs. potential quality concerns",
            "potential_impact_summary": "While automation may reduce costs, customers might associate it with lower quality or reduced human oversight."
          },
          {
            "name": "Company Brand",
            "trade_off_subtitle": "Innovation reputation vs. perceived integrity",
            "potential_impact_summary": "How the transition is communicated and managed will shape long-term brand trust and loyalty."
          }
        ]
      },
      {
        "title": "Company Culture",
        "subtitle": "Shifting to automation could dilute or transform workplace values.",
        "stakeholders": [
          {
            "name": "Remaining Employees",
            "trade_off_subtitle": "Adaptation to new roles vs. cultural disconnect",
            "potential_impact_summary": "Employees who stay may struggle with new workflows or feel disconnected from the company’s original mission."
          },
          {
            "name": "Leadership Team",
            "trade_off_subtitle": "Strategic gains vs. moral responsibility",
            "potential_impact_summary": "Leadership must balance profitability with ethical obligations to employees and stakeholders."
          }
        ]
      }
    ],
    "follow_up_clarification": "Would you like to explore alternatives (e.g., phased implementation, retraining programs) or focus on mitigating one of these consequences? Code:100-What legal considerations should be factored into employee layoffs or retraining during this transition? Code:0"
  }
}
```;

// Split by ~, remove empty sections, and trim each section
//let responseTemp     = ethics_completion.choices[0].message.content
let indexOne         = response.indexOf('```json')
let indexFinal       = response.indexOf('```')
let responseTempJson = response.substring(indexOne,indexFinal) 
//responseTemp       = responseTemp.replace('```json','')
//responseTemp       = responseTemp.replace('```','')
console.log("responseTempJson = ", responseTempJson)
let responseAsJson = JSON.parse(responseTempJson)
console.log('Final JSON  = ', responseAsJson)