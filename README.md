# Observe, Control, Deploy: Cloudflare AI Agents and MCP

  

A demonstration of Cloudflare's integrated AI platform showcasing how **AI Gateway** and **MCP Server Portals** provide unified observability and control, while Cloudflare's Agents SDK enables AI Agents and remote MCP servers. 

  

## 🔍 **OBSERVE & CONTROL** - AI Gateway + MCP Server Portals

 Gain complete visibility into AI operations while maintaining granular control over access, performance, and security through AI Gateway analytics and MCP Server Portal policies.
 
**[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)** gain visibility and control over your AI apps:
- Analytics
- Logging
- Caching
- Rate limiting
- Request and retry fallback
- Works with Workers AI and your favorite inference providers
 

**[MCP Server Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/)** centralize multiple MCP servers onto a single HTTP endpoint:

-  Streamlined access to multiple MCP servers
-  Customized tools per portal
-  Observability

  

## 🚀 **DEPLOY** - AI Agents and MCP Servers

Build and deploy AI agents and MCP servers globally using Cloudflare's serverless infrastructure with built-in state management, real-time communication, and extensible architecture.

 **[Build AI Agents on Cloudflare](https://agents.cloudflare.com/)**
-   Batteries (state) included: Agents come with  [built-in state management](https://developers.cloudflare.com/agents/api-reference/store-and-sync-state/), with the ability to automatically sync state between an Agent and clients, trigger events on state changes, and read+write to each Agent's SQL database.
-   Communicative: You can connect to an Agent via  [WebSockets](https://developers.cloudflare.com/agents/api-reference/websockets/)  and stream updates back to client in real-time. Handle a long-running response from a reasoning model, the results of an  [asynchronous workflow](https://developers.cloudflare.com/agents/api-reference/run-workflows/), or build a chat app that builds on the  `useAgent`  hook included in the Agents SDK.
-   Extensible: Agents are code. Use the  [AI models](https://developers.cloudflare.com/agents/api-reference/using-ai-models/)  you want, bring-your-own headless browser service, pull data from your database hosted in another cloud, add your own methods to your Agent and call them.


 **[Build Remote MCP Servers on Cloudflare](https://developers.cloudflare.com/agents/guides/remote-mcp-server/)**


  

## 📊 **The Application**

INSERT ARCHITECTURE DIAGRAM
  

### 🚀 **DEPLOY**: AI Agents & Remote MCP Servers


The application features two distinct **AI Agents**, both accessible via a chat interface, each with specialized capabilities and connection methods:

**1. Basic Math Agent**

-   **Local Capability:** Utilizes the `addTwoNumbers` tool for immediate, local computation.
-   **Server Connection:** Connects exclusively to the **Basic Math MCP Server Portal**.

**2. Advanced Math Agent**

-   **Local Capability:** Has no local tools.
-   **Server Integration:** Connects to the singular **Advanced Math MCP Server Portal**, which integrates access to three different remote MCP servers.

**Remote MCP Servers**

The application utilizes three dedicated remote MCP servers, each providing a specific toolset:

1. **Division MCP:** A single-purpose server designed exclusively to divide two numbers.
2. **Multiplication MCP:** A single-purpose server designed exclusively to multiply two numbers.
3. **Advanced Math MCP:** A multi-tool server providing complex functions such as square root, power, and trigonometric calculations.
  

### 🔍 **OBSERVE & CONTROL** - AI Gateway + MCP Server Portals

**AI Gateway:**
All communication with LLM providers is channeled through a single AI Gateway layer. The Gateway uses the Bring Your Own Key (BYOK) feature to simplify development and enhance security. Your application needs only one API key, while the AI Gateway securely manages and stores the separate vendor keys for providers like OpenAI, which this application uses, in it's dedicated secret store.

**MCP Server Portals**
The application utilizes two distinct **MCP Server Portals** to manage access to backend services:

-   **Basic Math Server Portal:** Provides limited access, connecting _only_ to the `multiply` MCP server.
-   **Advanced Math Server Portal:** Grants broad access to the `multiply`, `division`, and the `Advanced Math` Remote MCP Servers. Importantly, this portal is specifically configured to intentionally block the cosine and tangent math tools within the Advanced Math Remote server.
  