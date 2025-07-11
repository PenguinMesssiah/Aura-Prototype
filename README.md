# Aura: AI-Powered Decision Support System

**Author:** William Scott  
**Affiliation:** Carnegie Mellon University, Master of Human-Computer Interaction Program & Honda Research Institute

## Overview

**Aura** is an AI-powered Decision Support System (DSS) designed to help organizations make proactive, values-centered decisions. Developed as an industry-sponsored capstone project between Carnegie Mellon University and Honda Research Institute, Aura uses a multi-agent architecture to gather and synthesize the perspectives of key stakeholders within any decision environment.

### Key Features

- **Multi-Agent Perspective Elicitation:** Collects contextually relevant viewpoints from diverse stakeholders.
- **RAG Pipeline with Synthetic Data:** Ensures responses are grounded, relevant, and privacy-preserving.
- **Structured Interaction Phases:**
  - Onboarding: Customizes the system to user values and context.
  - Unintended Consequence Exploration: Identifies potential risks and ethical considerations.
  - Alternative Exploration: Suggests and evaluates strategic options.
  - Action Points: Delivers clear, actionable recommendations.

Aura is designed for C-suite executives and managerial teams, enabling them to anticipate challenges and opportunities rather than simply reacting to them.

## Purpose

Aura’s mission is to center AI-driven decision-making on the personal ethics and values of end users. By integrating ethical considerations from the outset, Aura demonstrates how non-technical users can actively shape AI systems that adapt to their evolving values—transcending traditional domains like transportation to address broader organizational needs[1].

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16+ recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)
- [Electron](https://www.electronjs.org/) (installed as a dependency)

### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/PenguinMesssiah/Sonder-Prototype.git
   cd Sonder-Prototype
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run the Application in Development**
   ```bash
   npm start
   ```

4. **Build the Electron Application**
   ```bash
   npm run build
   ```
   *(Adjust the build command if your project uses a different script.)*

5. **Package the App for Distribution**
   ```bash
   npm run package
   ```
   *(This step may require [electron-builder](https://www.electron.build/) or [electron-packager](https://www.electronjs.org/docs/latest/tutorial/packaging/).)*

## Citations

- Project vision and ethical framework inspired by the Honda Research Institute’s initiative to embed user ethics at the core of AI system design[1][2].
- Developed as part of the Carnegie Mellon University Master of Human-Computer Interaction Capstone, in collaboration with Honda Research Institute[1][2].

## Acknowledgements

Special thanks to the project collaborators at Honda Research Institute and the CMU MHCI faculty for their guidance and support.

## License

Please refer to the repository’s `LICENSE` file for licensing details.

*For more information, see the attached project brief and client overview.*

Sources
[1] Project-Brief-Print-Out.pdf https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/41731105/ea5ba642-53c8-4a0a-a0eb-707465e22b28/Project-Brief-Print-Out.pdf
[2] Client-Overview-Poster.pdf https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/41731105/31fca5c4-b8fe-420a-be4a-98ff344e8a42/Client-Overview-Poster.pdf
