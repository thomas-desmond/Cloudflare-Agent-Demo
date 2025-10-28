import { routeAgentRequest, type Schedule } from "agents";
import { getSchedulePrompt } from "agents/schedule";
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";
import { env } from "cloudflare:workers";

const openaiWithProxy = createOpenAI({
  baseURL:
    "https://gateway.ai.cloudflare.com/v1/d6850012d250c1600028b55d1d879b16/math-ai-agent/openai",
    headers: {
      "cf-aig-authorization": `Bearer ${process.env.AI_GATEWAY_API_KEY}`
    }
});

const model = openaiWithProxy("gpt-4o-2024-11-20");

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  private mcpConnected = false;
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {

    
    // Only connect if not already connected
    if (!this.mcpConnected) {
      console.log("🚀 Starting MCP connection...");
      const startTime = Date.now();

      await this.mcp.connect("https://basic-math.areyouaidemo.com/mcp", {
        transport: {
          requestInit: {
            headers: {
              "CF-Access-Client-Id": `${process.env.CF_ACCESS_CLIENT_ID}`,
              "CF-Access-Client-Secret": `${process.env.CF_ACCESS_CLIENT_SECRET}`
            }
          }
        }
      });
      
      this.mcpConnected = true;
      const endTime = Date.now();
      console.log(`✅ MCP connection completed in ${endTime - startTime}ms`);
    } else {
      console.log("📌 MCP already connected, skipping connection");
    }

    // Collect all tools, including MCP tools
    const mcpTools = this.mcp.getAITools();
    console.log("Available MCP tools:", Object.keys(mcpTools));

    const allTools = {
      ...tools,
      ...mcpTools
    };

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions
        });

        const result = streamText({
          system: `You are a helpful assistant that can do various tasks... 

${getSchedulePrompt({ date: new Date() })}

If the user asks to schedule a task, use the schedule tool to schedule the task.
`,

          messages: convertToModelMessages(processedMessages),
          model,
          tools: allTools,
          // Type boundary: streamText expects specific tool types, but base class uses ToolSet
          // This is safe because our tools satisfy ToolSet interface (verified by 'satisfies' in tools.ts)
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10)
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }
  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [
          {
            type: "text",
            text: `Running scheduled task: ${description}`
          }
        ],
        metadata: {
          createdAt: new Date()
        }
      }
    ]);
  }

  /**
   * Handle OAuth callback requests for MCP authentication
   */
  async onRequest(req: Request): Promise<Response> {
    // Handle the auth callback after finishing the MCP server auth flow
    if (this.mcp.isCallbackRequest(req)) {
      await this.mcp.handleCallbackRequest(req);
      return new Response("Authorized", {
        status: 200,
        headers: {
          "Content-Type": "text/html"
        }
      });
    }

    // Call the parent class method for other requests
    return super.onRequest(req);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/check-open-ai-key") {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      return Response.json({
        success: hasOpenAIKey
      });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "OPENAI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
