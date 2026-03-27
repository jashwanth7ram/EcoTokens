# 🌍 EcoTokens: Working & Workflow Guide

EcoTokens is a decentralized protocol built on the Ethereum blockchain (Sepolia Testnet) designed to provide a transparent, immutable, and automated lifecycle for carbon credits. It transforms carbon offset projects into tradeable ERC-20 tokens (CCT).

---

## 👥 1. User Roles

The system operates on a **Role-Based Access Control (RBAC)** model:

| Role | Description |
| :--- | :--- |
| **Admin** | The central authority (typically the contract deployer). Can grant or revoke roles to other users. |
| **Originator (Miner)** | Environmental project owners. They submit proof of carbon offset projects (e.g., reforestation) to claim credits. |
| **Auditor** | Independent verifiers. They review submitted projects and approve them, which triggers the minting of tokens. |
| **User / Buyer** | Any participant with a MetaMask wallet who can buy, hold, or trade Carbon Credit Tokens (CCT). |

---

## 🔄 2. The Lifecycle Workflow

### Phase 1: Onboarding
1. **Wallet Connection:** Users connect their MetaMask wallet to the EcoTokens Dashboard.
2. **Role Assignment:** The **Admin** grants the `ORIGINATOR_ROLE` to project owners and the `AUDITOR_ROLE` to trusted verifiers via the Admin panel.

### Phase 2: Credit Creation (Minting)
3. **Project Submission:** An **Originator** submits a project description and the requested number of CO2 tonnes (1 Tone = 1 CCT Token).
4. **Verification:** The project appears in the **Auditor's** "Pending Projects" list.
5. **Approval:** The **Auditor** reviews the project. Upon clicking "Approve", the smart contract automatically **mints** the equivalent CCT tokens directly into the Originator's wallet.

### Phase 3: Marketplace Trading
6. **Listing for Sale:** The token holder (Originator) goes to the **Marketplace** tab, sets a price in ETH, and clicks "List Tokens". 
    * *Note: The tokens are moved into the contract's secure escrow.*
7. **Buying Credits:** A **Buyer** browses the "Active Market Listings". They pay the required ETH to the contract.
8. **Settlement:** The smart contract instantly:
    * Sends the **ETH** to the Seller.
    * Sends the **CCT Tokens** to the Buyer.
    * Closes the listing.

### Phase 4: Management
9. **Cancellation:** If a seller changes their mind, they can "Cancel" their active listing to return the tokens from escrow back to their wallet.

---

## 🛠 3. Technical Architecture

- **Smart Contract (`CarbonCreditLifecycle.sol`):** Manages roles, ERC-20 token logic, project database, and marketplace escrow in a single, unified contract.
- **Frontend (`dashboard.html`):** A modern Web3 interface using **Ethers.js** to interact with the blockchain and **Tailwind CSS** for a premium "Emerald Protocol" aesthetic.
- **Backend (`Express/Node.js`):** Handles user authentication (optional) and serves the static frontend assets.
- **Blockchain:** Deployed on **Ethereum Sepolia** for testing and **Hardhat** for local development.

---

## 🚀 4. How to Run Locally

1. **Terminal 1 (Node):** `npx hardhat node`
2. **Terminal 2 (Deploy):** `npm run deploy:local`
3. **Terminal 3 (Server):** `node backend/server.js`
4. **Browser:** Open `http://localhost:3000`
